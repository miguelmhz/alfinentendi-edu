import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface InviteUserEmailProps {
  name?: string;
  email: string;
  temporaryPassword: string;
  isResend?: boolean;
  loginUrl: string;
}

export const InviteUserEmail = ({
  name,
  email,
  temporaryPassword,
  isResend = false,
  loginUrl,
}: InviteUserEmailProps) => {
  const previewText = isResend
    ? "Recordatorio de acceso a Al Fin Entendí EDU"
    : "Bienvenido a Al Fin Entendí EDU";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerText}>Al Fin Entendí EDU</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h1}>
              {isResend ? "¡Recordatorio de acceso!" : "¡Bienvenido!"}
            </Heading>

            <Text style={text}>Hola {name || "Usuario"},</Text>

            <Text style={text}>
              {isResend
                ? "Has solicitado un recordatorio de tus credenciales de acceso."
                : "Se ha creado una cuenta para ti en la plataforma Al Fin Entendí EDU."}
            </Text>

            <Section style={credentialsBox}>
              <Heading style={credentialsTitle}>
                Tus credenciales de acceso:
              </Heading>

              <Section style={credentialItem}>
                <Text style={credentialLabel}>Email:</Text>
                <Text style={credentialValue}>{email}</Text>
              </Section>

              <Section style={credentialItem}>
                <Text style={credentialLabel}>Contraseña temporal:</Text>
                <Text style={credentialValue}>{temporaryPassword}</Text>
              </Section>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                <strong>⚠️ Importante:</strong> Por tu seguridad, te
                recomendamos cambiar esta contraseña temporal después de
                iniciar sesión por primera vez.
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Iniciar Sesión
              </Button>
            </Section>

            <Text style={text}>
              Si tienes alguna pregunta o necesitas ayuda, no dudes en
              contactarnos.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Este es un correo automático, por favor no respondas a este
              mensaje.
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Al Fin Entendí EDU. Todos los
              derechos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InviteUserEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0",
  marginBottom: "64px",
};

const header = {
  backgroundColor: "#4F46E5",
  padding: "20px",
  textAlign: "center" as const,
};

const headerText = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0",
};

const content = {
  padding: "30px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 15px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const credentialsBox = {
  backgroundColor: "#ffffff",
  border: "2px solid #4F46E5",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const credentialsTitle = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 15px",
};

const credentialItem = {
  margin: "15px 0",
};

const credentialLabel = {
  color: "#4F46E5",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 5px",
};

const credentialValue = {
  backgroundColor: "#f0f0f0",
  borderRadius: "4px",
  color: "#333",
  fontFamily: "monospace",
  fontSize: "16px",
  margin: "0",
  padding: "8px",
};

const warningBox = {
  backgroundColor: "#FEF3C7",
  borderLeft: "4px solid #F59E0B",
  padding: "15px",
  margin: "20px 0",
};

const warningText = {
  color: "#92400E",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#4F46E5",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 30px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 20px",
  textAlign: "center" as const,
};

const footerText = {
  margin: "8px 0",
};
