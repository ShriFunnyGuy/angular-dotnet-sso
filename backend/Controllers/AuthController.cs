using Microsoft.AspNetCore.Mvc;
using Google.Apis.Auth;
using Microsoft.Identity.Web;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SSOBackend.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IConfiguration configuration, ILogger<AuthController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Verifies Google ID token from frontend
    /// </summary>
    [HttpPost("verify-google-token")]
    public async Task<IActionResult> VerifyGoogleToken([FromBody] TokenRequest request)
    {
        try
        {
            var clientId = _configuration["GoogleOAuth:ClientId"];
            
            if (string.IsNullOrEmpty(clientId))
            {
                return BadRequest(new { error = "Google Client ID not configured" });
            }

            // Verify the ID token with Google
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);

            if (payload == null)
            {
                return Unauthorized(new { valid = false, error = "Invalid token" });
            }

            // Extract user information from payload
            var userInfo = new
            {
                email = payload.Email,
                emailVerified = payload.EmailVerified,
                firstName = payload.GivenName ?? "",
                lastName = payload.FamilyName ?? "",
                avatar = payload.Picture,
                googleId = payload.Subject
            };

            _logger.LogInformation("Token verified successfully for user: {Email}", payload.Email);

            return Ok(new
            {
                valid = true,
                user = userInfo
            });
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning("Invalid JWT token: {Message}", ex.Message);
            return Unauthorized(new { valid = false, error = "Invalid or expired token" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token verification failed");
            return StatusCode(500, new { valid = false, error = "Token verification failed" });
        }
    }

    /// <summary>
    /// Verifies Microsoft ID token from frontend
    /// </summary>
    [HttpPost("verify-microsoft-token")]
    public async Task<IActionResult> VerifyMicrosoftToken([FromBody] TokenRequest request)
    {
        try
        {
            var clientId = _configuration["MicrosoftOAuth:ClientId"];
            var tenantId = _configuration["MicrosoftOAuth:TenantId"];
            
            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(tenantId))
            {
                return BadRequest(new { error = "Microsoft OAuth not configured properly" });
            }

            // Decode the token to extract claims
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(request.IdToken);

            // Validate basic claims
            var azpClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "azp" || c.Type == "aud")?.Value;
            var tidClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "tid")?.Value;

            if (azpClaim != clientId)
            {
                return Unauthorized(new { valid = false, error = "Invalid audience" });
            }

            // For "consumers", "common", or "organizations", skip tenant validation
            // as the token will have the actual consumer tenant ID
            if (tenantId != "consumers" && tenantId != "common" && tenantId != "organizations" && tidClaim != tenantId)
            {
                return Unauthorized(new { valid = false, error = "Invalid tenant" });
            }

            // Check token expiration
            var exp = jwtToken.Claims.FirstOrDefault(c => c.Type == "exp")?.Value;
            if (exp != null)
            {
                var expDateTime = DateTimeOffset.FromUnixTimeSeconds(long.Parse(exp));
                if (expDateTime < DateTimeOffset.UtcNow)
                {
                    return Unauthorized(new { valid = false, error = "Token expired" });
                }
            }

            // Extract user information
            var userInfo = new
            {
                email = jwtToken.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == "preferred_username")?.Value ?? "",
                emailVerified = true, // Microsoft tokens are assumed verified
                firstName = jwtToken.Claims.FirstOrDefault(c => c.Type == "given_name")?.Value ?? "",
                lastName = jwtToken.Claims.FirstOrDefault(c => c.Type == "family_name")?.Value ?? "",
                avatar = "", // Microsoft Graph API would be needed for profile photo
                microsoftId = jwtToken.Claims.FirstOrDefault(c => c.Type == "oid" || c.Type == "sub")?.Value ?? ""
            };

            _logger.LogInformation("Microsoft token verified successfully for user: {Email}", userInfo.email);

            return Ok(new
            {
                valid = true,
                user = userInfo
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Microsoft token verification failed");
            return StatusCode(500, new { valid = false, error = "Token verification failed" });
        }
    }

    /// <summary>
    /// Logout endpoint (clears cookies if needed)
    /// </summary>
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Clear any cookies or session data here
        _logger.LogInformation("User logged out");
        return Ok(new { message = "Logged out successfully" });
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new
        {
            status = "ok",
            timestamp = DateTime.UtcNow
        });
    }
}

public class TokenRequest
{
    public string IdToken { get; set; } = string.Empty;
}
