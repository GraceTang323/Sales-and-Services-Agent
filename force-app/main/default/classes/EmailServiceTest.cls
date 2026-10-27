@isTest
private class EmailServiceTest {

    /**
     * Helper setup methods
     */
    private static EmailService.EmailRequest createRequest(String toAddr, String body, String subject) {
        EmailService.EmailRequest req = new EmailService.EmailRequest();

        req.toAddress = toAddr;
        req.body = body;
        req.subject = subject;

        return req;
    }

    private static List<EmailService.EmailRequest> createMultipleRequests(Integer num, String toAddr) {
        List<EmailService.EmailRequest> requests = new List<EmailService.EmailRequest>();

        for (Integer i = 0; i < num; i++) {
            EmailService.EmailRequest req = createRequest(toAddr, 'Test body ' + i, 'Test subject');
            requests.add(req);
        }
        return requests;
    }
    
    @IsTest static void testPositiveSendSingleEmail() {
        List<EmailService.EmailRequest> reqs = createMultipleRequests(1, 'example@gmail.com');

        Test.startTest();
            Boolean result = EmailService.sendPlainTextEmail(reqs);
        Test.stopTest();

        Assert.isTrue(result, 'Expected result to be true for sending one valid email');
    }

    @IsTest static void testPositiveSendMultipleEmails() {
        List<EmailService.EmailRequest> reqs = createMultipleRequests(10, 'example@gmail.com');

        Test.startTest();
            Boolean result = EmailService.sendPlainTextEmail(reqs);
        Test.stopTest();

        Assert.isTrue(result, 'Expected result to be true for sending 10 valid emails');
    }

    @IsTest static void testNegativeNoEmails() {

        try {
            Test.startTest();
                Boolean result = EmailService.sendPlainTextEmail(new List<EmailService.EmailRequest>());
            Test.stopTest();
        } catch (Exception e) {
            Assert.fail('No exception should be thrown if input list is empty');
        }

        // Assert.isFalse(result, 'Expected result to be false for sending empty list of requests');
    }

    @IsTest static void testNegativeSendOneInvalidEmail() {

        EmailService.EmailRequest badReq = createRequest('', '', '');

        try {
            Test.startTest();
                Boolean result = EmailService.sendPlainTextEmail(new List<EmailService.EmailRequest>{ badReq });
            Test.stopTest();
            Assert.fail('Expected an EmailException to be thrown given a faulty request, but caught no exception.');

        } catch (System.EmailException e) {
            // expected exception caught; do nothing
        } catch (Exception e) {
            Assert.fail('Expected an EmailException to be thrown given a faulty request, but caught: ' + e.getTypeName());
        }
        
    }

    @IsTest static void testNegativeSendMultipleEmailsWithOneInvalid() {

        EmailService.EmailRequest badReq = createRequest('', '', '');
        List<EmailService.EmailRequest> reqs = createMultipleRequests(9, 'example@gmail.com');
        reqs.add(badReq);

        try {
            Test.startTest();
                Boolean result = EmailService.sendPlainTextEmail(reqs);
            Test.stopTest();
            Assert.fail('Expected an EmailException to be thrown given a faulty request, but caught no exception.');
        } catch (System.EmailException e) {
            // expected exception caught; do nothing
        } catch (Exception e) {
            Assert.fail('Expected an EmailException to be thrown given a faulty request, but caught: ' + e.getTypeName());
        }
    }
}