import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InviteEmailProps {
  workspaceName: string;
  inviterName: string;
  inviteUrl: string;
  role: string;
  expiresInDays?: number;
}

export default function InviteEmail({
  workspaceName,
  inviterName,
  inviteUrl,
  role,
  expiresInDays = 7,
}: InviteEmailProps) {
  return (
    <>
      <Html>
        <Head />
        <Preview>
          {inviterName} invited you to join {workspaceName} on DocuMind
        </Preview>
        <Body style={main}>
          <Container style={container}>
            {/* Header */}
            <Heading style={logo}>DocuMind</Heading>

            <Heading style={heading}>You're invited!</Heading>

            <Text style={paragraph}>
              <strong>{inviterName}</strong> has invited you to join the{" "}
              <strong>{workspaceName}</strong> workspace as a{" "}
              <strong>{role}</strong>.
            </Text>

            <Text style={paragraph}>
              Click the button below to accept the invitation and get started.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={inviteUrl}>
                Join {workspaceName}
              </Button>
            </Section>

            <Hr style={hr} />

            {/* Expiry note */}
            <Text style={footer}>
              This invitation will expire in {expiresInDays} days. If you were
              not expecting this invitation, you can safely ignore this email.
            </Text>
          </Container>
        </Body>
      </Html>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 32px",
  borderRadius: "8px",
  maxWidth: "480px",
};

const logo = {
  color: "#6366f1",
  fontSize: "24px",
  fontWeight: "700",
  marginBottom: "8px",
};

const heading = {
  color: "#1a1a1a",
  fontSize: "22px",
  fontWeight: "600",
  marginBottom: "16px",
};

const paragraph = {
  color: "#444",
  fontSize: "15px",
  lineHeight: "24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const footer = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "20px",
};
