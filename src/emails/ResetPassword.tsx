import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import config from '../config';

interface ResetPasswordProps {
  username: string;
  hashedToken: string;
}

export const ResetPassword = ({ username, hashedToken }: ResetPasswordProps) => {
  const url = `${config.FRONTEND_URL}/verify-me?token=${hashedToken}`;

  return (
    <Html>
      <Head />
      <Preview>Slaythebear - Reset your password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${config.FRONTEND_URL}/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.72b4bc1d.png&w=256&q=75`}
            width="40"
            height="33"
            alt="slaythebear"
          />
          <Section>
            <Text style={text}>Hi {username},</Text>
            <Text style={text}>
              We received a request to reset your Slaythebear account password. If you made this
              request, please click the button below to reset your password. This link will allow
              you to securely create a new password for your account:
            </Text>
            <Button style={button} href={url}>
              Change Password
            </Button>
            <Text style={text}>
              If the button doesn&apos;t work, please copy the link below and paste it into your
              browser to reset your password.
            </Text>
            <Text style={linkText}>{url}</Text>
            <Text style={text}>Happy Slaythebear!</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  padding: '10px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  padding: '45px',
};

const text = {
  fontSize: '16px',
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontWeight: '300',
  color: '#404040',
  lineHeight: '26px',
};

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '210px',
  padding: '14px 7px',
};

const linkText = {
  ...text,
  color: '#007ee6',
  textDecoration: 'underline',
};