import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, message, to } = await request.json();

    // Gmail送信用の設定
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // 例: "xxxx@gmail.com"
        pass: process.env.EMAIL_PASSWORD, // Gmailの「アプリパスワード」
      },
    });

    // メールの内容
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: `お問い合わせ: ${name}様より`,
      text: `
名前: ${name}
メールアドレス: ${email}

お問い合わせ内容:
${message}
      `,
    };

    // メール送信
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'メール送信が完了しました' });
  } catch (error) {
    console.error('メール送信エラー:', error);
    return NextResponse.json(
      { error: 'メール送信に失敗しました' },
      { status: 500 }
    );
  }
} 