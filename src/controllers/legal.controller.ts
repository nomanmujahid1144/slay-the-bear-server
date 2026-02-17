import { Request, Response, NextFunction } from 'express';
import { ApiResponseUtil } from '../utils/ApiResponse';

export class LegalController {

  static async getTermsOfService(req: Request, res: Response, next: NextFunction) {
    try {
      const tos = {
        title: 'Website Terms of Use',
        version: '1.0',
        lastRevised: 'November 22, 2025',
        effectiveDate: '2025-11-22',
        companyName: 'InfoTek, Inc.',
        websiteUrl: 'www.slaythebear.com',
        sections: [
          {
            id: 1,
            title: 'ACCOUNTS',
            subsections: [
              {
                id: '1.1',
                title: 'Account Creation',
                content:
                  'In order to use certain features of the Site, you must register for an account ("Account") and provide certain information about yourself as prompted by the account registration form. You represent and warrant that: (a) all required registration information you submit is truthful and accurate; (b) you will maintain the accuracy of such information. You may delete your Account at any time, for any reason, by following the instructions on the Site. Company may suspend or terminate your Account in accordance with Section 7.',
              },
              {
                id: '1.2',
                title: 'Account Responsibilities',
                content:
                  'You are responsible for maintaining the confidentiality of your Account login information and are fully responsible for all activities that occur under your Account. You agree to immediately notify Company of any unauthorized use, or suspected unauthorized use of your Account or any other breach of security. Company cannot and will not be liable for any loss or damage arising from your failure to comply with the above requirements.',
              },
            ],
          },
          {
            id: 2,
            title: 'ACCESS TO THE SITE',
            subsections: [
              {
                id: '2.1',
                title: 'License',
                content:
                  'Subject to these Terms, Company grants you a non-transferable, non-exclusive, revocable, limited license to use and access the Site solely for your own personal, noncommercial use.',
              },
              {
                id: '2.2',
                title: 'Certain Restrictions',
                content:
                  'The rights granted to you in these Terms are subject to the following restrictions: (a) you shall not license, sell, rent, lease, transfer, assign, distribute, host, or otherwise commercially exploit the Site, whether in whole or in part, or any content displayed on the Site; (b) you shall not modify, make derivative works of, disassemble, reverse compile or reverse engineer any part of the Site; (c) you shall not access the Site in order to build a similar or competitive website, product, or service; and (d) except as expressly stated herein, no part of the Site may be copied, reproduced, distributed, republished, downloaded, displayed, posted or transmitted in any form or by any means. Unless otherwise indicated, any future release, update, or other addition to functionality of the Site shall be subject to these Terms. All copyright and other proprietary notices on the Site (or on any content displayed on the Site) must be retained on all copies thereof.',
              },
              {
                id: '2.3',
                title: 'Modification',
                content:
                  'Company reserves the right, at any time, to modify, suspend, or discontinue the Site (in whole or in part) with or without notice to you. You agree that Company will not be liable to you or to any third party for any modification, suspension, or discontinuation of the Site or any part thereof.',
              },
              {
                id: '2.4',
                title: 'No Support or Maintenance',
                content:
                  'You acknowledge and agree that Company will have no obligation to provide you with any support or maintenance in connection with the Site.',
              },
              {
                id: '2.5',
                title: 'Ownership',
                content:
                  'You acknowledge that all the intellectual property rights, including copyrights, patents, trademarks, and trade secrets, in the Site and its content are owned by Company or Company\'s suppliers. Neither these Terms (nor your access to the Site) transfers to you or any third party any rights, title or interest in or to such intellectual property rights, except for the limited access rights expressly set forth in Section 2.1. Company and its suppliers reserve all rights not granted in these Terms. There are no implied licenses granted under these Terms.',
              },
            ],
          },
          {
            id: 3,
            title: 'INDEMNIFICATION',
            subsections: [
              {
                id: '3.0',
                title: 'Indemnification',
                content:
                  'You agree to indemnify and hold Company (and its officers, employees, and agents) harmless, including costs and attorneys\' fees, from any claim or demand made by any third party due to or arising out of (a) your use of the Site, (b) your violation of these Terms or (c) your violation of applicable laws or regulations. Company reserves the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate with our defense of these claims. You agree not to settle any matter without the prior written consent of Company. Company will use reasonable efforts to notify you of any such claim, action or proceeding upon becoming aware of it.',
              },
            ],
          },
          {
            id: 4,
            title: 'THIRD-PARTY LINKS & ADS; OTHER USERS',
            subsections: [
              {
                id: '4.1',
                title: 'Third-Party Links & Ads',
                content:
                  'The Site may contain links to third-party websites and services, and/or display advertisements for third parties (collectively, "Third-Party Links & Ads"). Such Third-Party Links & Ads are not under the control of Company, and Company is not responsible for any Third-Party Links & Ads. Company provides access to these Third-Party Links & Ads only as a convenience to you, and does not review, approve, monitor, endorse, warrant, or make any representations with respect to Third-Party Links & Ads. You use all Third-Party Links & Ads at your own risk, and should apply a suitable level of caution and discretion in doing so. When you click on any of the Third-Party Links & Ads, the applicable third party\'s terms and policies apply, including the third party\'s privacy and data gathering practices.',
              },
              {
                id: '4.2',
                title: 'Other Users',
                content:
                  'Your interactions with other Site users are solely between you and such users. You agree that Company will not be responsible for any loss or damage incurred as the result of any such interactions. If there is a dispute between you and any Site user, we are under no obligation to become involved.',
              },
              {
                id: '4.3',
                title: 'Release',
                content:
                  'You hereby release and forever discharge the Company (and our officers, employees, agents, successors, and assigns) from, and hereby waive and relinquish, each and every past, present and future dispute, claim, controversy, demand, right, obligation, liability, action and cause of action of every kind and nature (including personal injuries, death, and property damage), that has arisen or arises directly or indirectly out of, or that relates directly or indirectly to, the Site (including any interactions with, or act or omission of, other Site users or any Third-Party Links & Ads).',
              },
            ],
          },
          {
            id: 5,
            title: 'DISCLAIMERS',
            subsections: [
              {
                id: '5.0',
                title: 'Disclaimers',
                content:
                  'THE SITE IS PROVIDED ON AN "AS-IS" AND "AS AVAILABLE" BASIS, AND COMPANY (AND OUR SUPPLIERS) EXPRESSLY DISCLAIM ANY AND ALL WARRANTIES AND CONDITIONS OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING ALL WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, ACCURACY, OR NON-INFRINGEMENT. WE (AND OUR SUPPLIERS) MAKE NO WARRANTY THAT THE SITE WILL MEET YOUR REQUIREMENTS, WILL BE AVAILABLE ON AN UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE BASIS, OR WILL BE ACCURATE, RELIABLE, FREE OF VIRUSES OR OTHER HARMFUL CODE, COMPLETE, LEGAL, OR SAFE. IF APPLICABLE LAW REQUIRES ANY WARRANTIES WITH RESPECT TO THE SITE, ALL SUCH WARRANTIES ARE LIMITED IN DURATION TO NINETY (90) DAYS FROM THE DATE OF FIRST USE.',
              },
            ],
          },
          {
            id: 6,
            title: 'LIMITATION ON LIABILITY',
            subsections: [
              {
                id: '6.0',
                title: 'Limitation on Liability',
                content:
                  'TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL COMPANY (OR OUR SUPPLIERS) BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY LOST PROFITS, LOST DATA, COSTS OF PROCUREMENT OF SUBSTITUTE PRODUCTS, OR ANY INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL OR PUNITIVE DAMAGES ARISING FROM OR RELATING TO THESE TERMS OR YOUR USE OF, OR INABILITY TO USE, THE SITE, EVEN IF COMPANY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR LIABILITY TO YOU FOR ANY DAMAGES ARISING FROM OR RELATED TO THIS AGREEMENT WILL AT ALL TIMES BE LIMITED TO A MAXIMUM OF FIFTY US DOLLARS (U.S. $50).',
              },
            ],
          },
          {
            id: 7,
            title: 'TERM AND TERMINATION',
            subsections: [
              {
                id: '7.0',
                title: 'Term and Termination',
                content:
                  'Subject to this Section, these Terms will remain in full force and effect while you use the Site. We may suspend or terminate your rights to use the Site (including your Account) at any time for any reason at our sole discretion, including for any use of the Site in violation of these Terms. Upon termination of your rights under these Terms, your Account and right to access and use the Site will terminate immediately. Company will not have any liability whatsoever to you for any termination of your rights under these Terms, including for termination of your Account.',
              },
            ],
          },
          {
            id: 8,
            title: 'GENERAL',
            subsections: [
              {
                id: '8.1',
                title: 'Changes',
                content:
                  'These Terms are subject to occasional revision, and if we make any substantial changes, we may notify you by sending you an e-mail to the last e-mail address you provided to us (if any), and/or by prominently posting notice of the changes on our Site. Any changes to these Terms will be effective upon the earlier of thirty (30) calendar days following our dispatch of an e-mail notice to you (if applicable) or thirty (30) calendar days following our posting of notice of the changes on our Site.',
              },
              {
                id: '8.2',
                title: 'Dispute Resolution',
                content:
                  'All claims and disputes (excluding claims for injunctive or other equitable relief) in connection with the Terms or the use of any product or service provided by the Company that cannot be resolved informally or in small claims court shall be resolved by binding arbitration on an individual basis. Arbitration shall be initiated through the American Arbitration Association ("AAA"). Each party shall bear its own costs and disbursements arising out of the arbitration.',
              },
              {
                id: '8.3',
                title: 'Export',
                content:
                  'The Site may be subject to U.S. export control laws and may be subject to export or import regulations in other countries. You agree not to export, reexport, or transfer, directly or indirectly, any U.S. technical data acquired from Company, or any products utilizing such data, in violation of the United States export laws or regulations.',
              },
              {
                id: '8.4',
                title: 'Disclosures',
                content:
                  'If you are a New York resident, you may report complaints to the Complaint Assistance Unit of the Division of Consumer Protection of the Department of State by contacting them in writing at One Commerce Plaza, 99 Washington Ave Albany, NY 10038-3804, or by telephone at (800) 697-1220.',
              },
              {
                id: '8.5',
                title: 'Electronic Communications',
                content:
                  'The communications between you and Company use electronic means, whether you use the Site or send us emails, or whether Company posts notices on the Site or communicates with you via email. For contractual purposes, you (a) consent to receive communications from Company in an electronic form; and (b) agree that all terms and conditions, agreements, notices, disclosures, and other communications that Company provides to you electronically satisfy any legal requirement.',
              },
              {
                id: '8.6',
                title: 'Entire Terms',
                content:
                  'These Terms constitute the entire agreement between you and us regarding the use of the Site. Our failure to exercise or enforce any right or provision of these Terms shall not operate as a waiver of such right or provision. If any provision of these Terms is held to be invalid or unenforceable, the other provisions of these Terms will be unimpaired.',
              },
              {
                id: '8.7',
                title: 'Copyright/Trademark Information',
                content:
                  'Copyright © 2019 InfoTek, Inc. All rights reserved. All trademarks, logos and service marks ("Marks") displayed on the Site are our property or the property of other third parties. You are not permitted to use these Marks without our prior written consent or the consent of such third party which may own the Marks.',
              },
              {
                id: '8.8',
                title: 'Contact Information',
                content: 'InfoTek Inc., 99 Wall Street #2575, New York NY 10005. Email: support@inftk.com',
                contact: {
                  company: 'InfoTek Inc.',
                  address: '99 Wall Street #2575',
                  city: 'New York',
                  state: 'NY',
                  zip: '10005',
                  email: 'support@inftk.com',
                },
              },
            ],
          },
        ],
      };

      return ApiResponseUtil.success(res, tos, 'Terms of Service retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getPrivacyPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const privacyPolicy = {
        title: 'Privacy Policy',
        companyName: 'InfoTek, Inc.',
        websiteUrl: 'www.slaythebear.com',
        lastUpdated: 'November 22, 2025',
        effectiveDate: '2025-11-22',
        sections: [
          {
            id: 1,
            title: 'WHAT WE COLLECT',
            subsections: [
              {
                id: '1.1',
                title: 'Information You Give Us',
                content:
                  'We collect your name, postal address, email address, phone number, fax number, username, password, demographic information (such as your gender and occupation) as well as other information you directly give us on our Site.',
              },
              {
                id: '1.2',
                title: 'Information We Get From Others',
                content:
                  'We may get information about you from other sources. We may add this to information we get from this Site.',
              },
              {
                id: '1.3',
                title: 'Information Automatically Collected',
                content:
                  'We automatically log information about you and your computer. For example, when visiting our Site, we log your computer operating system type, browser type, browser language, the website you visited before browsing to our Site, pages you viewed, how long you spent on a page, access times and information about your use of and actions on our Site.',
              },
              {
                id: '1.4',
                title: 'Cookies',
                content:
                  'We may log information using "cookies." Cookies are small data files stored on your hard drive by a website. We may use both session Cookies (which expire once you close your web browser) and persistent Cookies (which stay on your computer until you delete them) to provide you with a more personal and interactive experience on our Site.',
              },
            ],
          },
          {
            id: 2,
            title: 'USE OF PERSONAL INFORMATION',
            content:
              'We use your personal information as follows:',
            items: [
              'We use your personal information to operate, maintain, and improve our sites, products, and services.',
              'We use your personal information to process and deliver contest entries and rewards.',
              'We use your personal information to respond to comments and questions and provide customer service.',
              'We use your personal information to send information including confirmations, invoices, technical notices, updates, security alerts, and support and administrative messages.',
              'We use your personal information to communicate about promotions, upcoming events, and other news about products and services offered by us and our selected partners.',
              'We use your personal information to link or combine user information with other personal information.',
              'We use your personal information to protect, investigate, and deter against fraudulent, unauthorized, or illegal activity.',
              'We use your personal information to provide and deliver products and services customers request.',
            ],
          },
          {
            id: 3,
            title: 'SHARING OF PERSONAL INFORMATION',
            content:
              'We may share personal information as follows:',
            items: [
              'We may share personal information with your consent. For example, you may let us share personal information with others for their own marketing uses. Those uses will be subject to their privacy policies.',
              'We may share personal information when we do a business deal, or negotiate a business deal, involving the sale or transfer of all or a part of our business or assets. These deals can include any merger, financing, acquisition, or bankruptcy transaction or proceeding.',
              'We may share personal information for legal, protection, and safety purposes including: to comply with laws, to respond to lawful requests and legal processes, to protect the rights and property of InfoTek, Inc., our agents, customers, and others, and in an emergency to protect the safety of our employees, agents, customers, or any person.',
              'We may share information with those who need it to do work for us.',
              'We may also share aggregated and/or anonymized data with others for their own uses.',
            ],
          },
          {
            id: 4,
            title: 'INFORMATION CHOICES AND CHANGES',
            content:
              'Our marketing emails tell you how to "opt-out." If you opt out, we may still send you non-marketing emails. Non-marketing emails include emails about your accounts and our business dealings with you. You may send requests about personal information to our Contact Information below. You can request to change contact choices, opt-out of our sharing with others, and update your personal information. You can typically remove and reject cookies from our Site with your browser settings. Many browsers are set to accept cookies until you change your settings. If you remove or reject our cookies, it could affect how our Site works for you.',
          },
          {
            id: 5,
            title: 'CONTACT INFORMATION',
            content:
              'We welcome your comments or questions about this privacy policy.',
            contact: {
              company: 'InfoTek, Inc.',
              address: '99 Wall Street #2575',
              city: 'New York',
              state: 'NY',
              zip: '10005',
              email: 'support@inftk.com',
            },
          },
          {
            id: 6,
            title: 'CHANGES TO THIS PRIVACY POLICY',
            content:
              'We may change this privacy policy. If we make any changes, we will change the Last Updated date above.',
          },
        ],
      };

      return ApiResponseUtil.success(res, privacyPolicy, 'Privacy Policy retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}