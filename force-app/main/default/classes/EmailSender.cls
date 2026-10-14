public with sharing class EmailSender {
    /**
     * Given a list of Email send requests, sends the emails.
     * Returns list of responses with sent confirmation and error messages (if any).
     */
    @InvocableMethod(
        label='Send Email'
        description='Sends email(s) to the target recipient(s).'
    )
    public static List<SendResponse> sendEmail(List<SendRequest> requests) {
        List<SendResponse> responses = new List<SendResponse>();

        if (requests == null) {
            return responses;
        }

        for (SendRequest req: requests) {
            SendResponse response = new SendResponse();

            try {
                if (req == null || String.isBlank(req.toAddress) || String.isBlank(req.emailSubject) || String.isBlank(req.emailBody)) {
                    response.emailSent = false;
                    response.emailError = 'Recipient, subject, and body are required.';
                } else {
                    EmailService.EmailRequest email = new EmailService.EmailRequest();
                    email.toAddress = req.toAddress;
                    email.subject = req.emailSubject;
                    email.body = req.emailBody;

                    Boolean result = EmailService.sendPlainTextEmail(new List<EmailService.EmailRequest>{ email });

                    response.emailSent = result;
                    response.emailError = result ? '' : 'Email was not sent';
                }
            } catch (Exception e) {
                response.emailSent = false;
                response.emailError = 'Email sending failed: ' + e.getMessage();
                System.debug(LoggingLevel.ERROR, 'EmailSender failed: ' + e.getMessage());
            }

            responses.add(response);
            
        }
        return responses;
    }

    public class SendRequest {
        @InvocableVariable(
            required=true
            description='Recipient email address to send the email to'
        )
        public String toAddress;

         @InvocableVariable(
            required=true
            description='Subject or topic of the email'
        )
        public String emailSubject;

         @InvocableVariable(
            required=true
            description='The plain text body of the email'
        )
        public String emailBody;
    }

    public class SendResponse {
         @InvocableVariable(
            required=true
            description='Confirmation if the email was sent successfully'
        )
        public Boolean emailSent;

        @InvocableVariable(
            description='Error message if the email could not be sent'
        )
        public String emailError;
    }
}