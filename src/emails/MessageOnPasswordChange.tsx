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

interface MessageOnPasswordChangeProps {
  username: string;
}

export const MessageOnPasswordChange = ({ username }: MessageOnPasswordChangeProps) => {
  const loginUrl = `${config.FRONTEND_URL}/login`;

  return (
    <Html>
      <Head />
      <Preview>Slaythebear - Password Changed Successfully</Preview>
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
              This email confirms that your Slaythebear account password has been successfully
              changed. If you made this change, no further action is required.
            </Text>
            <Text style={text}>
              If you did NOT change your password, please contact our support team immediately and
              consider securing your account.
            </Text>
            <Button style={button} href={loginUrl}>
              Login to Your Account
            </Button>
            <Text style={text}>
              For security reasons, we recommend using a strong, unique password and enabling
              two-factor authentication if available.
            </Text>
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