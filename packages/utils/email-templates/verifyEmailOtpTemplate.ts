export const verifyEmailOtpTemplate = (data: any) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification OTP</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, oklch(0.4570 0.0262 256.7994) 0%, oklch(0.5746 0.2126 29.5530) 100%);
                    margin: 0;
                    padding: 20px;
                    min-height: 100vh;
                }
                .email-wrapper {
                    max-width: 600px;
                    margin: 0 auto;
                    background: oklch(1.0000 0 0);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, oklch(0.5746 0.2126 29.5530) 0%, oklch(0.4570 0.0262 256.7994) 100%);
                    padding: 40px 30px;
                    text-align: center;
                    color: oklch(1.0000 0 0);
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                    letter-spacing: -0.5px;
                }
                .header .subtitle {
                    margin: 8px 0 0 0;
                    font-size: 16px;
                    opacity: 0.9;
                    font-weight: 400;
                }
                .content {
                    padding: 40px 30px;
                }
                .greeting {
                    font-size: 18px;
                    color: oklch(0.4570 0.0262 256.7994);
                    margin: 0 0 20px 0;
                    font-weight: 600;
                }
                .message {
                    color: oklch(0.4570 0.0262 256.7994);
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 30px 0;
                }
                .otp-container {
                    text-align: center;
                    margin: 30px 0;
                    padding: 30px;
                    background: linear-gradient(135deg, oklch(0.5746 0.2126 29.5530), oklch(0.4570 0.0262 256.7994));
                    border-radius: 12px;
                    position: relative;
                }
                .otp-container::before {
                    content: '';
                    position: absolute;
                    inset: 2px;
                    background: oklch(1.0000 0 0);
                    border-radius: 10px;
                    z-index: 1;
                }
                .otp-label {
                    position: relative;
                    z-index: 2;
                    font-size: 14px;
                    color: oklch(0.4570 0.0262 256.7994);
                    margin-bottom: 15px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .otp {
                    position: relative;
                    z-index: 2;
                    font-size: 36px;
                    font-weight: 700;
                    color: oklch(0.5746 0.2126 29.5530);
                    letter-spacing: 8px;
                    margin: 0;
                    font-family: 'Courier New', monospace;
                }
                .welcome-message {
                    background: linear-gradient(90deg, rgba(240,248,255,1) 0%, rgba(230,244,255,1) 100%);
                    border-left: 4px solid oklch(0.5746 0.2126 29.5530);
                    padding: 20px;
                    margin: 30px 0;
                    border-radius: 8px;
                    color: oklch(0.4570 0.0262 256.7994);
                    font-size: 14px;
                }
                .footer {
                    background: #f8f9fa;
                    padding: 30px;
                    text-align: center;
                    border-top: 1px solid #e9ecef;
                }
                .footer .company {
                    font-size: 18px;
                    font-weight: 600;
                    color: oklch(0.4570 0.0262 256.7994);
                    margin: 0 0 8px 0;
                }
                .footer .copyright {
                    font-size: 14px;
                    color: #6c757d;
                    margin: 0;
                }
                .footer .year {
                    color: oklch(0.5746 0.2126 29.5530);
                    font-weight: 600;
                }
                @media (max-width: 600px) {
                    body { padding: 10px; }
                    .header { padding: 30px 20px; }
                    .content { padding: 30px 20px; }
                    .footer { padding: 25px 20px; }
                    .otp { font-size: 28px; letter-spacing: 4px; }
                }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="header">
                    <h1>Email Verification</h1>
                    <p class="subtitle">Welcome to Animal Pet Management</p>
                </div>
                <div class="content">
                    <p class="greeting">Welcome!</p>
                    <p class="message">
                        Thank you for joining our Animal Pet Management platform! To complete your 
                        registration and secure your account, please verify your email address using 
                        the One-Time Password (OTP) below.
                    </p>
                    
                    <div class="otp-container">
                        <div class="otp-label">Your Verification Code</div>
                        <div class="otp">${data.otp}</div>
                    </div>
                    
                    <div class="welcome-message">
                        <strong>What's Next?</strong> Once verified, you'll have full access to manage 
                        pet registrations, track animal records, and connect with our community of 
                        pet lovers and professionals.
                    </div>
                </div>
                <div class="footer">
                    <p class="company">Animal Pet Management</p>
                    <p class="copyright">
                        &copy; <span class="year">${new Date().getFullYear()}</span> All rights reserved
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}
