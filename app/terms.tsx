import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/context/ThemeContext";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";

const TERMS_TEXT = `
Terms and Conditions
G(Old) — Canada (Ontario)
Effective Date: June 1, 2026
Last Updated: June 1, 2026

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
All accounts require email verification before becoming active.

5.3 Account Responsibility
You are responsible for account activity. Report compromise to security@gold.com.

5.4 Eligibility
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

7. User Terms
7.1 Platform Use
Browsing profiles does not require account; sending requests requires registration.

7.2 User Responsibilities
Use lawfully, communicate respectfully, attend sessions, pay agreed fees, and do not record without consent.

7.3 What Users Cannot Do
No harassment, fake activity, unauthorized commercial use, or platform circumvention.

7.4 On-site Engagement Responsibilities
Users must maintain safe premises and disclose hazards.

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
Reviews must be genuine and lawful.
We may remove violating content.
You retain ownership of submitted content and grant platform usage license.

12. Privacy and Data
Handled under PIPEDA and applicable Ontario law.
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
Users may close account via support@gold.com.
We may suspend/terminate for violations, false info, risk, or certification issues.

16. Disputes Between Users
G(Old) is not a party to Expert-User disputes but may mediate informally and enforce platform actions.

17. Governing Law and Jurisdiction
Governed by Ontario and applicable Canadian law.
Disputes resolved under Ontario court jurisdiction.

18. Changes to Terms
We may update terms; significant changes receive notice.
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
    fontSize: 14,
    lineHeight: 22,
  },
});

