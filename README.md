# Clone GPT - AI Chat Application

A modern, full-featured AI chat application built with Next.js 15, TypeScript, and MongoDB. This application provides a ChatGPT-like interface with real-time streaming responses, user authentication, and persistent chat history.

## 🚀 Features

- **AI-Powered Conversations**: Interactive chat interface with AI responses
- **Real-time Streaming**: Live streaming of AI responses for better user experience
- **User Authentication**: Secure authentication powered by Clerk
- **Persistent Chat History**: Save and manage multiple chat conversations with MongoDB
- **File Upload Support**: Process and analyze uploaded files in conversations
- **Dark/Light Mode**: Built-in theme switching for comfortable viewing
- **Responsive Design**: Mobile-first design that works seamlessly across all devices
- **Message Management**: Edit and regenerate messages within conversations

## 🛠️ Tech Stack

### Frontend

- **Next.js 15.4.6** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/UI** - Modern UI component library built on Radix UI primitives

### Backend & Database

- **MongoDB** - NoSQL database for chat storage
- **Mongoose 8.17.1** - MongoDB object modeling
- **Next.js API Routes** - Serverless API endpoints

### Authentication

- **Clerk** - Complete user management and authentication solution

### UI Components & Libraries

- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React** - Beautiful icon library
- **React Markdown** - Markdown rendering for formatted messages
- **Sonner** - Toast notifications
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### File Handling

- **Uploadcare** - File upload and processing
- **Cloudinary** - Image and media management

## 📁 Project Structure

```
clone-gpt/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   │   ├── signin/        # Sign in page
│   │   └── signup/        # Sign up page
│   ├── api/               # API endpoints
│   │   ├── chats/         # Chat CRUD operations
│   │   ├── files/         # File processing
│   │   └── test-perplexity/ # External API integration
│   ├── chat/              # Chat interface
│   │   ├── [chatId]/      # Individual chat pages
│   │   └── page.tsx       # Chat dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── chat/             # Chat-related components
│   │   ├── ChatInput.tsx # Message input component
│   │   ├── MessageList.tsx # Message display
│   │   └── Sidebar.tsx   # Chat history sidebar
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities and helpers
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── models/           # MongoDB schemas
│   └── mongodb.ts        # Database connection
├── middleware.ts         # Next.js middleware for auth
└── package.json          # Dependencies and scripts
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database (local or cloud)
- Clerk account for authentication
- Uploadcare account (optional, for file uploads)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Vasu-Gambhir/clone-gpt.git
cd clone-gpt
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chat
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/chat

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Uploadcare (optional)
NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY=your_uploadcare_public_key

# API Keys for AI services
OPENAI_API_KEY=your_openai_api_key # or other AI service
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🔒 Authentication Flow

1. Users land on the home page which redirects to `/chat`
2. Unauthenticated users are redirected to `/signin`
3. New users can create an account at `/signup`
4. After authentication, users are redirected to the chat interface
5. Clerk handles session management and user data

## 💬 Chat Features

- **Create New Chats**: Start fresh conversations with unique IDs
- **Chat History**: Access all previous conversations from the sidebar
- **Message Streaming**: Real-time AI response streaming
- **Edit Messages**: Modify sent messages and regenerate responses
- **File Attachments**: Upload and process files within conversations
- **Responsive Design**: Optimized for mobile, tablet, and desktop

## 🎨 Theming

The application supports both light and dark modes:

- Toggle between themes using the theme switcher in the header
- Theme preference is persisted across sessions
- Uses Tailwind CSS for consistent styling

## 🔧 Configuration

### MongoDB Schema

The application uses the following main schema:

**Chat Model:**

- `userId`: String (Clerk user ID)
- `title`: String
- `messages`: Array of message objects
  - `role`: 'user' | 'assistant'
  - `content`: String
  - `timestamp`: Date
- `createdAt`: Date
- `updatedAt`: Date

## 🚀 Deployment

This application can be deployed on various platforms:

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

- **Netlify**: Supports Next.js deployment
- **Railway**: Easy MongoDB integration
- **Render**: Full-stack deployment support

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Clerk](https://clerk.dev/) for authentication
- [Shadcn/UI](https://ui.shadcn.com/) for beautiful components
- [MongoDB](https://www.mongodb.com/) for database services
- [Vercel](https://vercel.com/) for hosting solutions

## 📧 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

Built with ❤️ using Next.js and TypeScript
