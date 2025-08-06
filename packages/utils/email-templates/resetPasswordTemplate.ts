export const resetPasswordTemplate = (data: any) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Successful</title>
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
                .success-icon {
                    text-align: center;
                    margin: 30px 0;
                    padding: 30px;
                    background: linear-gradient(135deg, oklch(0.5746 0.2126 29.5530), oklch(0.4570 0.0262 256.7994));
                    border-radius: 12px;
                    position: relative;
                }
                .success-icon::before {
                    content: '';
                    position: absolute;
                    inset: 2px;
                    background: oklch(1.0000 0 0);
                    border-radius: 10px;
                    z-index: 1;
                }
                .checkmark {
                    position: relative;
                    z-index: 2;
                    font-size: 48px;
                    color: oklch(0.5746 0.2126 29.5530);
                    margin-bottom: 15px;
                }
                .success-text {
                    position: relative;
                    z-index: 2;
                    font-size: 18px;
                    color: oklch(0.4570 0.0262 256.7994);
                    font-weight: 600;
                    margin: 0;
                }
                .security-tips {
                    background: linear-gradient(90deg, rgba(240,253,244,1) 0%, rgba(220,252,231,1) 100%);
                    border-left: 4px solid oklch(0.5746 0.2126 29.5530);
                    padding: 25px;
                    margin: 30px 0;
                    border-radius: 8px;
                }
                .security-tips h3 {
                    color: oklch(0.4570 0.0262 256.7994);
                    margin: 0 0 15px 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                .security-tips ul {
                    color: oklch(0.4570 0.0262 256.7994);
                    margin: 0;
                    padding-left: 20px;
                    line-height: 1.8;
                }
                .security-tips li {
                    margin-bottom: 8px;
                }
                .cta-button {
                    text-align: center;
                    margin: 30px 0;
                }
                .button {
                    display: inline-block;
                    background: linear-gradient(135deg, oklch(0.5746 0.2126 29.5530) 0%, oklch(0.4570 0.0262 256.7994) 100%);
                    color: oklch(1.0000 0 0);
                    text-decoration: none;
                    padding: 15px 30px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    transition: transform 0.2s ease;
                }
                .button:hover {
                    transform: translateY(-2px);
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
                    .security-tips { padding: 20px; }
                    .checkmark { font-size: 36px; }
                }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="header">
                    <h1>Password Reset Complete</h1>
                    <p class="subtitle">Your account security has been updated</p>
                </div>
                <div class="content">
                    <p class="greeting">Hello there!</p>
                    <p class="message">
                        Great news! Your password has been successfully reset. Your Animal Pet Management 
                        account is now secured with your new password, and all previous sessions have been 
                        logged out for your security.
                    </p>
                    
                    <div class="success-icon">
                        <div class="checkmark">✓</div>
                        <p class="success-text">Password Successfully Updated</p>
                    </div>
                    
                    <div class="security-tips">
                        <h3>Security Best Practices:</h3>
                        <ul>
                            <li>Use a unique password that you don't use elsewhere</li>
                            <li>Consider using a password manager</li>
                            <li>Enable two-factor authentication if available</li>
                            <li>Regularly update your password every 90 days</li>
                            <li>Never share your password with anyone</li>
                        </ul>
                    </div>
                    
                    <div class="cta-button">
                        <a href="${data.loginUrl || '#'}" class="button">
                            Sign In to Your Account
                        </a>
                    </div>
                    
                    <p class="message">
                        If you did not initiate this password reset, please contact our support team 
                        immediately. Your account security is our top priority.
                    </p>
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
     