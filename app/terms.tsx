import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TERMS_VERSION } from "@/src/constants/trust";
import { useTheme } from "@/src/context/ThemeContext";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";

const TERMS_TEXT = `
Terms and Conditions
G(Old) — Canada (Ontario)
Version: ${TERMS_VERSION}
Effective Date: June 1, 2026
Last Updated: November 3, 2026

A note before you read:
We've written these terms to be clear and honest — not to hide things in legal language. Please read them. They protect you and they protect the experts on our platform.
If you have questions, email us at legal@gold.com

1. Who We Are
G(Old) is a product of 2AM Creations ("we", "us", "our"), a company operating in Canada and India.
G(Old) ("the Platform") is an online marketplace that connects retired and experienced professionals ("Experts") with individuals, homeowners, students, founders, and companies ("Users") who want access to their knowledge, skills, and hands-on experience.
Our registered address for Canadian operations: [INSERT ADDRESS]
Contact: legal@gold.com

2. The Most Important Thing You Need To Understand
G(Old) is a platform. We are not a service provider.
This means:
- G(Old) does not employ Experts
- G(Old) does not provide the services Experts offer
- G(Old) does not supervise, control, or direct Expert work
- G(Old) does not guarantee outcomes of sessions or engagements
- G(Old) connects Experts and Users; arrangements are between them

3. Definitions
Platform: G(Old) website, app, and related services
Expert: professional registered on G(Old) to offer sessions or on-site engagements
User: person or entity that engages Experts
Session: remote knowledge-sharing engagement
On-site Engagement: in-person engagement (Toronto area only)
Request: formal inquiry sent through the Platform
Agreement: arrangement made between Expert and User
Content: submitted text, media, reviews, or materials

4. Acceptance of These Terms
By creating an account, you confirm:
1) You read and understood these Terms
2) You are at least 18 years old
3) You have legal capacity to enter a binding agreement
4) You agree to be bound by these Terms
If you do not agree, do not use the Platform.

5. Account Registration
5.1 Creating Your Account
- Provide accurate, complete, current information
- Keep information updated
- Keep password confidential
- Do not share account credentials
- Do not create more than one account per person

5.2 Email Verification
We send a 6-digit code to the email address you sign up with. You need a verified email to request a session, and Experts need one before their profile can be approved.

5.3 Forgotten Password
You can reset your password with a code sent to your email. Resetting it signs you out on all other devices.

5.4 Account Responsibility
You are responsible for account activity. Report compromise to security@gold.com.

5.5 Eligibility
Available to residents of Canada (Ontario) and India.

6. Expert Terms
6.1 Application and Verification
Experts must submit complete profiles, provide ID when requested, and for regulated trades provide valid certification details.
False credentials may lead to immediate permanent removal.

6.2 Regulated vs Unregulated Trades (Ontario)
Regulated trade Experts must hold valid required credentials.
Experts warrant certifications are valid, active, and not revoked/suspended.
Experts must notify G(Old) immediately if certification status changes.

6.3 Independent Contractor Status
Experts are independent contractors, not employees of 2AM Creations.
Experts are responsible for taxes, insurance, and legal compliance.

6.4 Expert Responsibilities
Accuracy, professional conduct, safety compliance, and confidentiality are mandatory.

6.5 What Experts Cannot Do
No misrepresentation, no unlicensed regulated services, no discriminatory conduct, no data misuse, and no circumvention of platform terms.

6.6 Insurance for On-site Engagements
Experts who offer On-site Engagements must hold, and keep in force, liability insurance appropriate to the work, and must declare this to G(Old). G(Old) does not insure Experts or Users.

6.7 Approval and Resubmission
G(Old) reviews every Expert before their profile goes live. A rejection is sent with a reason. A rejected application may be edited and resubmitted once; a second rejection is final. The Verified badge and any licence shown on a profile appear only after G(Old) has checked them.

7. User Terms
7.1 Platform Use
Browsing profiles does not require account; sending requests requires registration.

7.2 User Responsibilities
Use lawfully, communicate respectfully, attend sessions, pay agreed fees, and do not record without consent.

7.3 What Users Cannot Do
No harassment, fake activity, unauthorized commercial use, or platform circumvention.

7.4 On-site Engagement Responsibilities
Users must maintain safe premises and disclose hazards. Users must not ask an Expert to carry out work that legally requires a licence or permit (such as electrical, gas, plumbing or HVAC work in Ontario) unless the Expert holds that licence and the required permits are in place.

7.5 Experience-Based Sessions, Not Professional Advice
Sessions are conversations in which Experts share their own experience. Unless an Expert separately agrees in writing to act in a licensed professional capacity, a Session is not legal, medical, financial, investment, tax, real estate, engineering or other licensed professional advice, and does not create a lawyer–client, doctor–patient, adviser–client or similar relationship. Before you send a Request in a sensitive field, the Platform shows notes you must acknowledge; we keep a record of which notes you acknowledged and when. You are responsible for your own decisions and for seeking licensed advice where it is needed.

8. G(Old)'s Role
8.1 We operate the platform, verify credentials, provide communication channels, and moderate content.
8.2 We are not responsible for outcomes, conduct outside platform, or quality/safety of third-party services.
8.3 We do not guarantee availability, outcomes, or satisfaction.

9. Liability
9.1 Liability cap: greater of CAD $100 or fees paid to G(Old) in prior 3 months.
9.2 Excludes indirect, consequential, and specified losses to maximum extent permitted.
9.3 Experts are solely responsible for their own service conduct and outcomes.
9.4 Nothing excludes non-excludable liability under law.

10. Indemnification
You agree to indemnify 2AM Creations for claims arising from your use, violations, legal breaches, or disputes.

11. Reviews and Content
Only a User who completed a Session may review it, and only once per Session.
Reviews must be genuine, lawful, and about the Session.
We may hide reviews that breach these Terms; hidden reviews do not count towards an Expert's recommendation figures.
We may remove violating content.
You retain ownership of submitted content and grant platform usage license.

12. Privacy and Data
In Canada, personal information is handled under the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable Ontario law.
In India, personal data is handled under the Digital Personal Data Protection Act, 2023 (DPDP Act).
We collect account/profile/usage/device and communication data.
No sale of personal data.
Rights include access, correction, withdrawal (where applicable), and deletion requests.
Contact: privacy@gold.com

13. Intellectual Property
Platform IP belongs to 2AM Creations.
Expert-created materials remain Expert IP unless transferred in writing.

14. Prohibited Conduct
No fake accounts, impersonation, scraping, hacking, illegal activity, harassment, discrimination, or abuse.

15. Suspension and Termination
You can delete your account at any time in the app (Profile, then Delete account). We then erase your personal details and cancel your open requests. Reviews and messages you wrote stay visible to the people they were for, shown as from a "Former member". We keep a record of the Terms you accepted, as the law requires.
We may suspend/terminate for violations, false info, risk, or certification issues.

16. Disputes Between Users
G(Old) is not a party to Expert-User disputes but may mediate informally and enforce platform actions.

17. Governing Law and Jurisdiction
Governed by Ontario and applicable Canadian law.
Disputes resolved under Ontario court jurisdiction.

18. Changes to Terms
We may update terms; significant changes receive notice.
We record the version of these Terms you accepted, the acknowledgements you gave, and when.
Continued use after changes means acceptance.

19. Severability
Invalid provisions are modified minimally; remaining terms stay effective.

20. Entire Agreement
These Terms with Privacy Policy form full agreement regarding Platform use.

21. Contact
Legal: legal@gold.com
Support: support@gold.com
Privacy: privacy@gold.com
Address: [INSERT CANADIAN ADDRESS]

Expert-Specific Acknowledgement
- I am an independent contractor
- I am responsible for my tax obligations
- My credentials are accurate and valid
- I will notify G(Old) of certification changes
- I carry suitable liability insurance for on-site work
- I understand G(Old) is not liable for claims from my sessions/work
- I have read and agree to the full Terms and Conditions

User-Specific Acknowledgement
- G(Old) is a platform connecting me with independent Experts
- G(Old) is not responsible for session/on-site outcomes
- I will ensure safe premises for on-site engagements
- I will not circumvent the platform for relationships originated on G(Old) for first 12 months
- I have read and agree to the full Terms and Conditions

G(Old) — Where Experience Meets Opportunity
by 2AM Creations
`;

export default function TermsScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Terms & Conditions</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{TERMS_TEXT}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: spacing.sm,
    paddingBottom: spacing.xl,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
  },
});

