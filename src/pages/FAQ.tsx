import { ArrowLeft, HelpCircle, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const FAQ = () => {
  const faqCategories = [
    {
      title: "Général",
      icon: HelpCircle,
      questions: [
        {
          question: "Qu'est-ce qu'AgroCI ?",
          answer: "AgroCI est une plateforme de mise en relation directe entre producteurs agricoles et acheteurs de produits vivriers en gros. Notre mission est de faciliter le commerce des produits agricoles en Côte d'Ivoire et en Afrique de l'Ouest."
        },
        {
          question: "Comment fonctionne la plateforme ?",
          answer: "Les producteurs créent un compte, publient leurs produits avec photos et prix. Les acheteurs peuvent parcourir les annonces, consulter les détails et contacter directement les producteurs via WhatsApp pour négocier et finaliser leurs achats."
        },
        {
          question: "L'inscription est-elle gratuite ?",
          answer: "Oui, l'inscription de base est gratuite. Les producteurs peuvent publier jusqu'à 3 produits gratuitement. Pour publier plus de produits ou accéder à des fonctionnalités avancées, des abonnements premium sont disponibles."
        },
        {
          question: "Dans quels pays la plateforme est-elle disponible ?",
          answer: "AgroCI est principalement active en Côte d'Ivoire mais accueille également des utilisateurs d'autres pays d'Afrique de l'Ouest comme le Burkina Faso, le Mali, le Sénégal, le Ghana, etc."
        }
      ]
    },
    {
      title: "Pour les Producteurs",
      icon: MessageCircle,
      questions: [
        {
          question: "Comment créer un compte producteur ?",
          answer: "Cliquez sur 'Inscription', sélectionnez 'Producteur', remplissez vos informations personnelles (nom, pays, région, numéro WhatsApp) et validez. Vous pourrez ensuite publier vos produits immédiatement."
        },
        {
          question: "Combien de produits puis-je publier ?",
          answer: "Avec un compte gratuit, vous pouvez publier jusqu'à 3 produits. Pour en publier davantage, vous devez souscrire à un abonnement premium qui offre des crédits supplémentaires et des fonctionnalités avancées."
        },
        {
          question: "Comment devenir 'Producteur vérifié' ?",
          answer: "Le statut 'Producteur vérifié' est accordé par notre équipe après vérification de votre identité et de votre activité agricole. Ce badge renforce la confiance des acheteurs. Contactez-nous via WhatsApp pour en faire la demande."
        },
        {
          question: "Comment modifier ou supprimer un produit ?",
          answer: "Connectez-vous à votre tableau de bord, accédez à 'Mes produits' et cliquez sur le bouton modifier ou supprimer à côté du produit concerné. Note : cette fonctionnalité peut être restreinte selon votre abonnement."
        },
        {
          question: "Comment voir mes statistiques ?",
          answer: "Votre tableau de bord affiche vos statistiques : nombre de vues sur vos produits, clics sur votre WhatsApp, et demandes de contact reçues. Ces données vous aident à optimiser vos annonces."
        }
      ]
    },
    {
      title: "Pour les Acheteurs",
      icon: MessageCircle,
      questions: [
        {
          question: "Comment contacter un producteur ?",
          answer: "Sur la fiche d'un produit, cliquez sur 'Contacter le producteur'. Si vous avez des crédits disponibles, vous accéderez aux coordonnées WhatsApp du producteur pour échanger directement avec lui."
        },
        {
          question: "Les crédits sont-ils nécessaires pour contacter un producteur ?",
          answer: "Oui, chaque contact avec un nouveau producteur consomme un crédit. Ce système garantit la qualité des contacts pour les producteurs. Des crédits gratuits sont offerts à l'inscription et des packs de crédits sont disponibles à l'achat."
        },
        {
          question: "Comment rechercher des produits spécifiques ?",
          answer: "Utilisez les filtres de recherche sur la page Produits : catégorie (maïs, riz, manioc, etc.), localisation, fourchette de prix. Vous pouvez également rechercher par nom de produit."
        },
        {
          question: "Les prix affichés sont-ils négociables ?",
          answer: "Les prix affichés sont indicatifs et généralement négociables selon les quantités commandées. Contactez directement le producteur via WhatsApp pour discuter des tarifs selon vos besoins."
        }
      ]
    },
    {
      title: "Paiements et Abonnements",
      icon: Mail,
      questions: [
        {
          question: "Quels moyens de paiement sont acceptés ?",
          answer: "Nous acceptons les paiements par mobile money (Orange Money, MTN Money, Moov Money, Wave) via notre système de paiement sécurisé Paystack."
        },
        {
          question: "Comment souscrire à un abonnement ?",
          answer: "Rendez-vous sur la page 'Abonnements', choisissez le forfait adapté à vos besoins et procédez au paiement. Les crédits sont ajoutés instantanément à votre compte après confirmation du paiement."
        },
        {
          question: "Puis-je obtenir un remboursement ?",
          answer: "Les crédits achetés ne sont pas remboursables mais n'expirent pas. Si vous rencontrez un problème technique, contactez notre support et nous étudierons votre situation au cas par cas."
        }
      ]
    },
    {
      title: "Sécurité et Confidentialité",
      icon: HelpCircle,
      questions: [
        {
          question: "Mes données sont-elles protégées ?",
          answer: "Oui, nous utilisons des technologies de chiffrement modernes pour protéger vos données. Consultez notre Politique de confidentialité pour plus de détails sur la gestion de vos informations."
        },
        {
          question: "Comment signaler un abus ou une fraude ?",
          answer: "Si vous constatez un comportement suspect, contactez-nous immédiatement via WhatsApp au +225 0789363442 ou par email à josephguessanbi@gmail.com. Nous examinerons la situation et prendrons les mesures nécessaires."
        },
        {
          question: "Comment supprimer mon compte ?",
          answer: "Pour supprimer votre compte, accédez à votre tableau de bord et utilisez l'option de suppression de compte. Toutes vos données seront effacées conformément à notre politique de confidentialité."
        }
      ]
    }
  ];

  const whatsappLink = "https://wa.me/2250789363442?text=Bonjour%2C%20j%27ai%20une%20question%20concernant%20AgroCI";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-4">Foire Aux Questions</h1>
          <p className="text-muted-foreground">
            Trouvez des réponses aux questions les plus fréquentes sur AgroCI
          </p>
        </div>

        {/* Contact rapide */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Vous ne trouvez pas votre réponse ?</h3>
                <p className="text-muted-foreground text-sm">
                  Notre équipe est disponible pour vous aider via WhatsApp
                </p>
              </div>
              <Button 
                className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                onClick={() => window.open(whatsappLink, '_blank')}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Contacter sur WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Catégories de FAQ */}
        <div className="space-y-8">
          {faqCategories.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <category.icon className="h-5 w-5" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, faqIndex) => (
                    <AccordionItem key={faqIndex} value={`item-${index}-${faqIndex}`}>
                      <AccordionTrigger className="text-left hover:text-primary">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Section Contact finale */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">Besoin d'aide supplémentaire ?</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Notre équipe est à votre disposition pour répondre à toutes vos questions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="default"
                onClick={() => window.open(whatsappLink, '_blank')}
                className="bg-[#25D366] hover:bg-[#128C7E]"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp : +225 0789363442
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = 'mailto:josephguessanbi@gmail.com'}
              >
                <Mail className="mr-2 h-4 w-4" />
                josephguessanbi@gmail.com
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;
