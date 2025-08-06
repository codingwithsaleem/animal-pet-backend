export const welcomeTemplate = (data: any) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Animal Pet Management</title>
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
                .features {
                    background: linear-gradient(90deg, rgba(240,248,255,1) 0%, rgba(230,244,255,1) 100%);
                    border-left: 4px solid oklch(0.5746 0.2126 29.5530);
                    padding: 25px;
                    margin: 30px 0;
                    border-radius: 8px;
                }
                .features h3 {
                    color: oklch(0.4570 0.0262 256.7994);
                    margin: 0 0 15px 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                .features ul {
                    color: oklch(0.4570 0.0262 256.7994);
                    margin: 0;
                    padding-left: 20px;
                    line-height: 1.8;
                }
                .features li {
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
                    .features { padding: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="header">
                    <h1>Welcome Aboard!</h1>
                    <p class="subtitle">Your journey with Animal Pet Management begins</p>
                </div>
                <div class="content">
                    <p class="greeting">Hello ${data.fullName || 'there'}!</p>
                    <p class="message">
                        Congratulations! Your email has been successfully verified and your account 
                        is now active. Welcome to our comprehensive Animal Pet Management platform, 
                        where caring for pets meets modern technology.
                    </p>
                    
                    <div class="features">
                        <h3>What you can do now:</h3>
                        <ul>
                            <li>Register and manage cat and dog records</li>
                            <li>Track pet health, vaccination, and breeding information</li>
                            <li>Search and filter through comprehensive pet databases</li>
                            <li>Generate reports and maintain detailed pet profiles</li>
                            <li>Connect with other pet owners and professionals</li>
                        </ul>
                    </div>
                    
                    <div class="cta-button">
                        <a href="${data.loginUrl || '#'}" class="button">
                            Get Started Now
                        </a>
                    </div>
                    
                    <p class="message">
                        If you have any questions or need assistance, our support team is here to help. 
                        Thank you for choosing us to be part of your pet care journey!
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
       