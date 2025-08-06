export const forgotPasswordOtpTemplate = (data: any) => {
    return `
        <html>
        <head>
            <style>
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: #f4f6fb;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 420px;
                    margin: 40px auto;
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                    padding: 32px 28px;
                }
                .header {
                    text-align: center;
                    color: #2d3a4b;
                    margin-bottom: 18px;
                }
                .otp {
                    display: inline-block;
                    background: #eaf1fb;
                    color: #2563eb;
                    font-size: 2.2em;
                    letter-spacing: 8px;
                    font-weight: bold;
                    padding: 12px 32px;
                    border-radius: 8px;
                    margin: 18px 0;
                }
                .footer {
                    color: #7a869a;
                    font-size: 0.95em;
                    margin-top: 32px;
                    text-align: center;
                }
                p {
                    color: #3b4252;
                    line-height: 1.6;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="header">Forgot Password OTP</h1>
                <p>Hi,</p>
                <p>You requested to reset your password. Please use the following OTP to proceed:</p>
                <div class="otp">${data.otp}</div>
                <p>If you did not request this, please ignore this email.</p>
                <div class="footer">
                    Thank you!<br>
                    &copy; ${new Date().getFullYear()} Your Company
                </div>
            </div>
        </body>
        </html>
    `;
}