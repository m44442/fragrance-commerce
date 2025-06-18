import nodemailer from 'nodemailer';

// SMTP設定
const createTransporter = () => {
  if (process.env.EMAIL_PROVIDER === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // その他のSMTPプロバイダー
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
};

interface OrderEmailData {
  id: string;
  user: {
    name: string;
    email: string;
  };
  items: Array<{
    product: {
      name: string;
      brand?: {
        name: string;
      };
    };
    quantity: number;
    isSample: boolean;
  }>;
  total: number;
  shippingAddress?: {
    name: string;
    zipCode: string;
    prefecture: string;
    city: string;
    address: string;
    building?: string;
  };
}

export async function sendShippingNotificationEmail(order: OrderEmailData) {
  try {
    const transporter = createTransporter();

    const subject = `【発送完了】ご注文商品を発送いたしました（注文番号: ${order.id.slice(-8)}）`;
    
    const itemsList = order.items.map(item => 
      `・${item.product.name} ${item.isSample ? '(試供品)' : ''} × ${item.quantity}`
    ).join('\n');

    const shippingInfo = order.shippingAddress 
      ? `
お届け先:
${order.shippingAddress.name} 様
〒${order.shippingAddress.zipCode}
${order.shippingAddress.prefecture}${order.shippingAddress.city}${order.shippingAddress.address}
${order.shippingAddress.building || ''}
      `.trim()
      : '';

    const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>発送完了のお知らせ</title>
    <style>
        body { font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background-color: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
        .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #495057; margin: 0;">発送完了のお知らせ</h1>
        </div>
        
        <div class="content">
            <p>${order.user.name} 様</p>
            
            <p>いつもご利用いただき、ありがとうございます。<br>
            ご注文いただいた商品を発送いたしましたのでお知らせいたします。</p>
            
            <div class="order-details">
                <h3 style="color: #495057; margin-top: 0;">注文詳細</h3>
                <p><strong>注文番号:</strong> ${order.id.slice(-8)}</p>
                <p><strong>ご注文商品:</strong></p>
                <div style="margin-left: 20px;">
                    ${order.items.map(item => `
                        <p>・${item.product.name} ${item.isSample ? '(試供品)' : ''} × ${item.quantity}</p>
                    `).join('')}
                </div>
                <p><strong>ご注文金額:</strong> ¥${order.total.toLocaleString()}</p>
                
                ${shippingInfo ? `
                <p><strong>お届け先:</strong></p>
                <div style="margin-left: 20px;">
                    <p>${order.shippingAddress!.name} 様<br>
                    〒${order.shippingAddress!.zipCode}<br>
                    ${order.shippingAddress!.prefecture}${order.shippingAddress!.city}${order.shippingAddress!.address}<br>
                    ${order.shippingAddress!.building || ''}</p>
                </div>
                ` : ''}
            </div>
            
            <p><strong>配送について:</strong><br>
            商品は通常2-3営業日でお届け予定です。配送状況は配送業者の追跡サービスでご確認いただけます。</p>
            
            <p>商品がお手元に届きましたら、内容をご確認ください。<br>
            万が一、商品に問題がございましたら、お気軽にお問い合わせください。</p>
        </div>
        
        <div class="footer">
            <p>このメールは自動配信されています。<br>
            ご不明な点がございましたら、カスタマーサポートまでお問い合わせください。</p>
            
            <p>フレグランスコマース<br>
            Email: support@fragrance-commerce.com</p>
        </div>
    </div>
</body>
</html>
    `;

    const textContent = `
${order.user.name} 様

いつもご利用いただき、ありがとうございます。
ご注文いただいた商品を発送いたしましたのでお知らせいたします。

■ 注文詳細
注文番号: ${order.id.slice(-8)}

ご注文商品:
${itemsList}

ご注文金額: ¥${order.total.toLocaleString()}

${shippingInfo}

■ 配送について
商品は通常2-3営業日でお届け予定です。配送状況は配送業者の追跡サービスでご確認いただけます。

商品がお手元に届きましたら、内容をご確認ください。
万が一、商品に問題がございましたら、お気軽にお問い合わせください。

---
このメールは自動配信されています。
ご不明な点がございましたら、カスタマーサポートまでお問い合わせください。

フレグランスコマース
Email: support@fragrance-commerce.com
    `;

    const mailOptions = {
      from: `"フレグランスコマース" <${process.env.EMAIL_USER}>`,
      to: order.user.email,
      subject,
      text: textContent,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Shipping notification email sent:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('Error sending shipping notification email:', error);
    return { success: false, error };
  }
}

export async function sendRefundNotificationEmail(order: OrderEmailData, refundAmount: number, reason: string) {
  try {
    const transporter = createTransporter();

    const subject = `【返金完了】ご注文の返金処理が完了いたしました（注文番号: ${order.id.slice(-8)}）`;
    
    const itemsList = order.items.map(item => 
      `・${item.product.name} ${item.isSample ? '(試供品)' : ''} × ${item.quantity}`
    ).join('\n');

    const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>返金完了のお知らせ</title>
    <style>
        body { font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background-color: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
        .refund-details { background-color: #d4edda; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #c3e6cb; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #495057; margin: 0;">返金完了のお知らせ</h1>
        </div>
        
        <div class="content">
            <p>${order.user.name} 様</p>
            
            <p>ご注文の返金処理が完了いたしましたのでお知らせいたします。</p>
            
            <div class="refund-details">
                <h3 style="color: #155724; margin-top: 0;">返金詳細</h3>
                <p><strong>注文番号:</strong> ${order.id.slice(-8)}</p>
                <p><strong>返金金額:</strong> ¥${refundAmount.toLocaleString()}</p>
                <p><strong>返金理由:</strong> ${reason}</p>
            </div>
            
            <p><strong>返金対象商品:</strong></p>
            <div style="margin-left: 20px;">
                ${order.items.map(item => `
                    <p>・${item.product.name} ${item.isSample ? '(試供品)' : ''} × ${item.quantity}</p>
                `).join('')}
            </div>
            
            <p><strong>返金について:</strong><br>
            返金は通常3-5営業日でお客様のクレジットカードまたは決済方法に反映されます。<br>
            金融機関によっては、反映に時間がかかる場合がございますのでご了承ください。</p>
            
            <p>ご不便をおかけして申し訳ございませんでした。<br>
            今後ともどうぞよろしくお願いいたします。</p>
        </div>
        
        <div class="footer">
            <p>このメールは自動配信されています。<br>
            ご不明な点がございましたら、カスタマーサポートまでお問い合わせください。</p>
            
            <p>フレグランスコマース<br>
            Email: support@fragrance-commerce.com</p>
        </div>
    </div>
</body>
</html>
    `;

    const textContent = `
${order.user.name} 様

ご注文の返金処理が完了いたしましたのでお知らせいたします。

■ 返金詳細
注文番号: ${order.id.slice(-8)}
返金金額: ¥${refundAmount.toLocaleString()}
返金理由: ${reason}

■ 返金対象商品
${itemsList}

■ 返金について
返金は通常3-5営業日でお客様のクレジットカードまたは決済方法に反映されます。
金融機関によっては、反映に時間がかかる場合がございますのでご了承ください。

ご不便をおかけして申し訳ございませんでした。
今後ともどうぞよろしくお願いいたします。

---
このメールは自動配信されています。
ご不明な点がございましたら、カスタマーサポートまでお問い合わせください。

フレグランスコマース
Email: support@fragrance-commerce.com
    `;

    const mailOptions = {
      from: `"フレグランスコマース" <${process.env.EMAIL_USER}>`,
      to: order.user.email,
      subject,
      text: textContent,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Refund notification email sent:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('Error sending refund notification email:', error);
    return { success: false, error };
  }
}