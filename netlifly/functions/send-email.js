// netlify/functions/send-email.js
// Esta função envia e-mails com anexos usando Nodemailer e SendGrid

const nodemailer = require('nodemailer');

// Configuração do transporte de e-mail
// Você precisa configurar as variáveis de ambiente no Netlify
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'apikey',
        pass: process.env.SMTP_PASSWORD // Sua chave de API SendGrid
    }
});

exports.handler = async (event) => {
    // Apenas aceita requisições POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Método não permitido' })
        };
    }

    try {
        const { name, email, area, fileName, fileContent, fileType } = JSON.parse(event.body);

        // Validação básica
        if (!name || !email || !area || !fileContent) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Dados incompletos' })
            };
        }

        // Converte o Base64 de volta para Buffer
        const fileBuffer = Buffer.from(fileContent, 'base64');

        // Mapeia as áreas para descrições mais legíveis
        const areaDescriptions = {
            desenvolvimento: 'Desenvolvimento de Software',
            devops: 'DevOps & SRE',
            seguranca: 'Segurança da Informação',
            dados: 'Ciência de Dados & Analytics',
            cloud: 'Cloud Computing',
            infra: 'Infraestrutura & Redes',
            outro: 'Outra área'
        };

        const areaLabel = areaDescriptions[area] || area;

        // Configura o conteúdo do e-mail
        const mailOptions = {
            from: process.env.SENDER_EMAIL || 'noreply@techtalentbroker.com',
            to: 'b2business@msn.com',
            subject: `Nova Candidatura - ${areaLabel} - ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4285F4;">Nova Candidatura Recebida</h2>
                    <p>Uma nova candidatura foi recebida através do formulário de recrutamento.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Nome:</strong> ${name}</p>
                        <p><strong>E-mail:</strong> ${email}</p>
                        <p><strong>Área Pretendida:</strong> ${areaLabel}</p>
                        <p><strong>Currículo Anexado:</strong> ${fileName}</p>
                    </div>
                    
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        Este é um e-mail automático enviado pelo sistema de recrutamento Tech Talent Broker.
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: fileName,
                    content: fileBuffer,
                    contentType: fileType
                }
            ],
            replyTo: email // Permite responder diretamente para o candidato
        };

        // Envia o e-mail
        await transporter.sendMail(mailOptions);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: 'E-mail enviado com sucesso!',
                success: true
            })
        };

    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'Erro ao enviar o e-mail. Por favor, tente novamente mais tarde.',
                error: error.message
            })
        };
    }
};

