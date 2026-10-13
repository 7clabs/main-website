# Contact form setup

The form posts to `/api/contact`, which emails `contact@7clabs.com` through SMTP.
It needs these environment variables. Never commit real values.

| Variable | Example | Notes |
|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` or `smtp.zoho.com` | Your mail provider's SMTP server |
| `SMTP_PORT` | `465` | 465 uses SSL; other ports use STARTTLS |
| `SMTP_USER` | `contact@7clabs.com` | The mailbox that sends the messages |
| `SMTP_PASS` | (secret) | An app password for the mailbox, not the normal password |
| `CONTACT_TO` | `contact@7clabs.com` | Optional. Where enquiries arrive. Defaults to `contact@7clabs.com` |

## On Vercel
Project > Settings > Environment Variables. Add the four variables for Production
(and Preview if you want to test there), then redeploy.

## Locally
Create `.env.local` (it is git-ignored) with the same names, then run `npm run dev`.

## Provider notes
- **Google Workspace:** turn on 2-step verification for the mailbox, then create an App Password.
  Your admin may need to allow SMTP/app passwords.
- **Zoho Mail:** use the mailbox password or an app-specific password, with `smtp.zoho.com`.
- Replies go to the visitor, because the visitor's address is set as Reply-To.
