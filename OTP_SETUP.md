# OTP Email Configuration Setup

## Environment Variables Required

Create a `.env` file in the backend directory with the following email configuration:

```env
# Email Configuration (for OTP sending)
MAIL_SERVICE=gmail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=your-email@gmail.com
```

## Gmail Setup (Recommended)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `MAIL_PASS`

## Other Email Providers

### Outlook/Hotmail
```env
MAIL_SERVICE=hotmail
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_SECURE=false
```

### Yahoo
```env
MAIL_SERVICE=yahoo
MAIL_HOST=smtp.mail.yahoo.com
MAIL_PORT=587
MAIL_SECURE=false
```

## OTP Features Implemented

✅ **Rate Limiting**: Users can only request OTP once per minute
✅ **Security**: OTP expires in 5 minutes
✅ **Attempt Limiting**: Maximum 3 failed attempts before OTP is invalidated
✅ **Error Handling**: Proper error messages for email sending failures
✅ **OTP Cleanup**: Previous unused OTPs are automatically invalidated

## API Endpoints

- `POST /api/auth/login/request-otp` - Request OTP for login
- `POST /api/auth/login/verify-otp` - Verify OTP and login

## Testing

You can test the OTP functionality using the Swagger UI at:
`http://localhost:8001/api-docs`
