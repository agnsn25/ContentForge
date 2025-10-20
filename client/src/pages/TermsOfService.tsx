import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-foreground">Terms of Service</h1>
          
          <div className="space-y-6 text-foreground">
            <p className="text-sm text-muted-foreground">
              Last Updated: October 20, 2025
            </p>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using ContentHammer ("the Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">2. Content Ownership and Copyright Compliance</h2>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-semibold text-foreground">You represent and warrant that:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    You own all rights to any content you upload, submit, or provide to the Service, OR you have obtained 
                    all necessary permissions, licenses, and authorizations to use such content and create derivative works from it.
                  </li>
                  <li>
                    Your use of the Service to transform, repurpose, or modify content does not and will not infringe upon, 
                    misappropriate, or violate any third party's copyright, trademark, patent, trade secret, or other intellectual 
                    property rights, or rights of publicity or privacy.
                  </li>
                  <li>
                    You will not use the Service to transform content belonging to others without explicit written permission 
                    from the copyright holder.
                  </li>
                  <li>
                    You understand that creating derivative works (including AI-generated transformations) from copyrighted 
                    material without permission may constitute copyright infringement.
                  </li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">3. Prohibited Uses</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>You may NOT use the Service to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Transform, repurpose, or modify content owned by third parties without proper authorization</li>
                  <li>Violate any applicable laws, regulations, or third-party rights</li>
                  <li>Create content that infringes on intellectual property rights of others</li>
                  <li>Circumvent or bypass any technological protection measures</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">4. User Responsibility and Liability</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">You are solely responsible</strong> for ensuring that your use of 
                  the Service complies with all applicable copyright laws and regulations. The Service is intended for use 
                  with content that you own or have permission to use.
                </p>
                <p>
                  You acknowledge that we do not and cannot verify that you have the necessary rights to the content you 
                  provide. Any legal consequences arising from copyright infringement or unauthorized use of content are 
                  your sole responsibility.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">5. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify, defend, and hold harmless ContentHammer, its operators, affiliates, and service 
                providers from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees 
                (including reasonable attorneys' fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Your use or misuse of the Service</li>
                <li>Your violation of these Terms of Service</li>
                <li>Your violation of any rights of another party, including copyright infringement</li>
                <li>Any content you submit, upload, or transform using the Service</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">6. DMCA Compliance</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  We respect the intellectual property rights of others and comply with the Digital Millennium Copyright Act (DMCA). 
                  If you believe that content created using our Service infringes your copyright, please contact us with:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>A description of the copyrighted work you claim has been infringed</li>
                  <li>Identification of the infringing material and its location</li>
                  <li>Your contact information</li>
                  <li>A statement of good faith belief that the use is not authorized</li>
                  <li>A statement under penalty of perjury that the information is accurate</li>
                  <li>Your physical or electronic signature</li>
                </ul>
                <p className="mt-3">
                  We reserve the right to terminate accounts of repeat infringers.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">7. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
                WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT THE AI-GENERATED 
                CONTENT WILL BE ACCURATE OR FREE FROM COPYRIGHT ISSUES.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL CONTENTHAMMER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR COPYRIGHT INFRINGEMENT 
                CLAIMS, ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">9. Modifications to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms of Service at any time. Continued use of the Service after changes 
                constitutes acceptance of the modified terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">10. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms of Service or to report copyright infringement, please contact us through 
                the appropriate channels provided in the Service.
              </p>
            </section>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold text-foreground mb-2">
                Remember: This Service is designed for transforming YOUR OWN content.
              </p>
              <p className="text-sm text-muted-foreground">
                Always ensure you have the necessary rights before uploading or transforming any content. When in doubt, 
                consult with a legal professional about copyright compliance.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
