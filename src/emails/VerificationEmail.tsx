// WITH JWT TOKEN

// import {
//   Body,
//   Button,
//   Container,
//   Head,
//   Html,
//   Img,
//   Preview,
//   Section,
//   Text,
// } from '@react-email/components';
// import * as React from 'react';
// import config from '../config';

// interface VerificationEmailProps {
//   username: string;
//   hashedToken: string;
// }

// export const VerificationEmail = ({ username, hashedToken }: VerificationEmailProps) => {
//   const url = `${config.FRONTEND_URL}/verifyemail?token=${hashedToken}`;

//   return (
//     <Html>
//       <Head />
//       <Preview>Slaythebear - Verify your email</Preview>
//       <Body style={main}>
//         <Container style={container}>
//           <Img
//             src={`${config.FRONTEND_URL}/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.72b4bc1d.png&w=256&q=75`}
//             width="40"
//             height="33"
//             alt="slaythebear"
//           />
//           <Section>
//             <Text style={text}>Hi {username},</Text>
//             <Text style={text}>
//               Welcome to Slaythebear! To complete your sign-up process and verify your email
//               address, please click the button below. This will confirm that this email belongs to
//               you and activate your account:
//             </Text>
//             <Button style={button} href={url}>
//               Verify Email
//             </Button>
//             <Text style={text}>
//               If the button doesn&apos;t work, please copy the link below and paste it into your
//               browser to complete the verification process.
//             </Text>
//             <Text style={linkText}>{url}</Text>
//             <Text style={text}>Happy Slaythebear!</Text>
//           </Section>
//         </Container>
//       </Body>
//     </Html>
//   );
// };

// const main = {
//   backgroundColor: '#f6f9fc',
//   padding: '10px 0',
// };

// const container = {
//   backgroundColor: '#ffffff',
//   border: '1px solid #f0f0f0',
//   padding: '45px',
// };

// const text = {
//   fontSize: '16px',
//   fontFamily:
//     "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
//   fontWeight: '300',
//   color: '#404040',
//   lineHeight: '26px',
// };

// const button = {
//   backgroundColor: '#007ee6',
//   borderRadius: '4px',
//   color: '#fff',
//   fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
//   fontSize: '15px',
//   textDecoration: 'none',
//   textAlign: 'center' as const,
//   display: 'block',
//   width: '210px',
//   padding: '14px 7px',
// };

// const linkText = {
//   ...text,
//   color: '#007ee6',
//   textDecoration: 'underline',
// };



// WITH OTP

import {
  Body,
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

interface VerificationEmailProps {
  username: string;
  otp: string;
}

export const VerificationEmail = ({ username, otp }: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Slaythebear - Your verification code is {otp}</Preview>
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
              Welcome to Slaythebear! Use the verification code below to confirm your email
              address and activate your account:
            </Text>
            <Text style={otpCode}>{otp}</Text>
            <Text style={text}>
              This code will expire in 10 minutes. If you didn&apos;t create an account with
              Slaythebear, you can safely ignore this email.
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

const otpCode = {
  fontSize: '36px',
  fontFamily: "'Courier New', Courier, monospace",
  fontWeight: '700',
  color: '#135F8A',
  letterSpacing: '8px',
  textAlign: 'center' as const,
  backgroundColor: '#f0f7fb',
  border: '1px solid #d6e9f5',
  borderRadius: '8px',
  padding: '16px 0',
  margin: '24px 0',
};