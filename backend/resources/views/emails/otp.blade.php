<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 40px 20px; margin: 0; color: #0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <tr>
            <td style="background: #0f172a; padding: 32px; text-align: center;">
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                        <td style="padding-right: 10px; vertical-align: middle;">
                            <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.1); border-radius: 8px;"></div>
                        </td>
                        <td style="vertical-align: middle;">
                            <span style="color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: -0.02em;">LoanEdge</span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 36px 32px;">
                <p style="font-size: 15px; color: #334155; margin: 0 0 16px; line-height: 1.6;">
                    Dear Customer,
                </p>
                <p style="font-size: 15px; color: #334155; margin: 0 0 28px; line-height: 1.6;">
                    Please use the verification code below to proceed. This code is valid for the next 10 minutes.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <div style="display: inline-block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 36px;">
                        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a; font-family: 'Courier New', monospace;">
                            {{ $otp }}
                        </span>
                    </div>
                </div>
                <p style="font-size: 13px; color: #94a3b8; margin: 28px 0 0; line-height: 1.6;">
                    If you did not request this code, please disregard this email or contact our support team if you believe your account may be at risk.
                </p>
            </td>
        </tr>
        <tr>
            <td style="background: #f8fafc; padding: 20px 36px; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.6;">
                    This is an automated message from LoanEdge NBFC. Please do not reply to this email.<br>
                    © {{ date('Y') }} LoanEdge NBFC. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>