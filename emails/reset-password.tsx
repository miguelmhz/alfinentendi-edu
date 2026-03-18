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
} from "@react-email/components";

interface ResetPasswordEmailProps {
  resetLink: string;
}

export default function ResetPasswordEmail({
  resetLink,
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Restablece tu contraseña en Al Fin Entendí – EDU</Preview>

      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Restablecer contraseña</Heading>

          <Text style={text}>
            Recibimos una solicitud para restablecer la contraseña de tu cuenta
            en <strong>Al Fin Entendí – EDU</strong>.
          </Text>

          <Text style={text}>
            Haz clic en el siguiente botón para crear una nueva contraseña. Este
            enlace es válido por <strong>1 hora</strong>.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={resetLink}>
              Restablecer contraseña
            </Button>
          </Section>

          <Text style={text}>
            Si no solicitaste este cambio, puedes ignorar este mensaje. Tu
            contraseña no será modificada.
          </Text>

          <Text style={footer}>
            Saludos,
            <br />
            <strong>Equipo Al Fin Entendí – EDU</strong>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/* ===== Estilos ===== */

const main = {
  backgroundColor: "#f4f6f8",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
};

const h1 = {
  color: "#142850",
  fontSize: "24px",
  fontWeight: "700",
  margin: "32px 0 16px",
  padding: "0 40px",
};

const text = {
  color: "#333333",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "16px 0",
  padding: "0 40px",
};

const buttonContainer = {
  padding: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#27496D",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
};

const footer = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "22px",
  margin: "40px 0 0",
  padding: "0 40px",
};
