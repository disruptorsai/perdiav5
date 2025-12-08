import { useState, useEffect } from 'react'

const SECRET_PASSWORD = 'dm2026'

function CollapsibleAppendix({ id, title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(false) // Always start collapsed

  return (
    <div className="appendix-section" id={id}>
      <button
        className="appendix-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="appendix-toggle-icon">{isOpen ? '−' : '+'}</span>
        <span>{title}</span>
      </button>
      {isOpen && <div className="appendix-content">{children}</div>}
    </div>
  )
}

export default function SecretJosh() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const auth = sessionStorage.getItem('secret-josh-auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === SECRET_PASSWORD) {
      sessionStorage.setItem('secret-josh-auth', 'true')
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  const scrollToVideo = () => {
    document.getElementById('video-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!isAuthenticated) {
    return (
      <div className="password-screen">
        <style>{`
          .password-screen {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #1a1a2e;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 16px;
            box-sizing: border-box;
          }
          .password-form {
            background-color: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          @media (min-width: 768px) {
            .password-form {
              padding: 40px;
            }
          }
          .password-form h2 {
            color: #1a1a2e;
            margin-bottom: 20px;
            font-size: 1.3rem;
          }
          @media (min-width: 768px) {
            .password-form h2 {
              font-size: 1.5rem;
            }
          }
          .password-form input {
            width: 100%;
            padding: 14px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 4px;
            margin-bottom: 15px;
            box-sizing: border-box;
            -webkit-appearance: none;
          }
          .password-form input:focus {
            outline: none;
            border-color: #4a4a8a;
          }
          .password-form .error {
            color: #f44336;
            margin-bottom: 15px;
          }
          .password-form button {
            width: 100%;
            padding: 14px;
            font-size: 16px;
            background-color: #4a4a8a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
            -webkit-appearance: none;
          }
          .password-form button:hover {
            background-color: #2d2d5a;
          }
          .password-form button:active {
            background-color: #1a1a3a;
          }
        `}</style>
        <form onSubmit={handleSubmit} className="password-form">
          <h2>Password Required</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Access Document</button>
        </form>
      </div>
    )
  }

  return (
    <div className="document-container">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .document-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 16px;
          color: #333;
          background-color: #fff;
          min-height: 100vh;
        }

        @media (min-width: 768px) {
          .document-container {
            padding: 40px 60px;
          }
        }

        @media (min-width: 1200px) {
          .document-container {
            padding: 40px 80px;
          }
        }

        @media (min-width: 1600px) {
          .document-container {
            padding: 40px 120px;
          }
        }

        .header {
          text-align: center;
          margin-bottom: 20px;
          padding: 16px;
          background: linear-gradient(135deg, #1a1a2e 0%, #4a4a8a 100%);
          color: white;
          border-radius: 8px;
        }

        @media (min-width: 768px) {
          .header {
            margin-bottom: 30px;
            padding: 24px;
          }
        }

        .header h1 {
          color: white;
          border: none;
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.3;
        }

        @media (min-width: 768px) {
          .header h1 {
            font-size: 2rem;
          }
        }

        .header p {
          margin: 5px 0;
          opacity: 0.9;
          font-size: 0.85rem;
        }

        @media (min-width: 768px) {
          .header p {
            font-size: 1rem;
          }
        }

        .video-notice {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border: 2px solid #2196f3;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          text-align: center;
        }

        @media (min-width: 768px) {
          .video-notice {
            padding: 15px 20px;
            margin-bottom: 30px;
          }
        }

        .video-notice p {
          margin: 0;
          color: #1565c0;
          font-weight: 500;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        @media (min-width: 768px) {
          .video-notice p {
            font-size: 1rem;
          }
        }

        .video-notice a {
          color: #0d47a1;
          text-decoration: underline;
          cursor: pointer;
          font-weight: 600;
        }

        .video-notice a:hover {
          color: #1a237e;
        }

        .intro {
          background-color: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 0.95rem;
        }

        @media (min-width: 768px) {
          .intro {
            padding: 24px;
            margin-bottom: 30px;
            font-size: 1rem;
          }
        }

        .section {
          margin-bottom: 20px;
          padding: 16px;
          background-color: #fafafa;
          border-radius: 8px;
          border-left: 4px solid #4a4a8a;
        }

        @media (min-width: 768px) {
          .section {
            padding: 25px;
            margin-bottom: 40px;
          }
        }

        h1 {
          color: #1a1a2e;
          border-bottom: 3px solid #4a4a8a;
          padding-bottom: 10px;
          font-size: 1.3rem;
          line-height: 1.3;
        }

        @media (min-width: 768px) {
          h1 {
            font-size: 2rem;
          }
        }

        h2 {
          color: #2d2d5a;
          margin-top: 20px;
          border-left: 4px solid #4a4a8a;
          padding-left: 12px;
          font-size: 1.1rem;
          line-height: 1.3;
        }

        @media (min-width: 768px) {
          h2 {
            font-size: 1.5rem;
            margin-top: 40px;
            padding-left: 15px;
          }
        }

        h3 {
          color: #3d3d6a;
          font-size: 1rem;
          line-height: 1.4;
        }

        @media (min-width: 768px) {
          h3 {
            font-size: 1.1rem;
          }
        }

        .position-box {
          background-color: #e8e8f0;
          padding: 12px;
          border-radius: 5px;
          margin: 12px 0;
          font-size: 0.9rem;
        }

        @media (min-width: 768px) {
          .position-box {
            padding: 15px;
            margin: 15px 0;
            font-size: 1rem;
          }
        }

        .position-box strong {
          color: #2d2d5a;
        }

        .response-box {
          background-color: #f0f8f0;
          padding: 12px;
          border-radius: 5px;
          margin: 12px 0;
          border-left: 3px solid #4a8a4a;
          font-size: 0.9rem;
        }

        @media (min-width: 768px) {
          .response-box {
            padding: 15px;
            margin: 15px 0;
            font-size: 1rem;
          }
        }

        .my-position {
          background-color: #fff3e0;
          padding: 12px;
          border-radius: 5px;
          margin: 12px 0;
          border-left: 3px solid #ff9800;
          font-size: 0.9rem;
        }

        @media (min-width: 768px) {
          .my-position {
            padding: 15px;
            margin: 15px 0;
            font-size: 1rem;
          }
        }

        blockquote {
          background-color: #f5f5f5;
          border-left: 4px solid #666;
          padding: 12px 16px;
          margin: 16px 0;
          font-style: italic;
          color: #555;
          font-size: 0.9rem;
        }

        @media (min-width: 768px) {
          blockquote {
            padding: 15px 20px;
            margin: 20px 0;
            font-size: 1rem;
          }
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 0.8rem;
          display: block;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        @media (min-width: 768px) {
          table {
            display: table;
            font-size: 1rem;
            margin: 20px 0;
          }
        }

        th, td {
          border: 1px solid #ddd;
          padding: 8px 6px;
          text-align: left;
          min-width: 80px;
        }

        @media (min-width: 768px) {
          th, td {
            padding: 12px;
            min-width: 100px;
          }
        }

        th {
          background-color: #4a4a8a;
          color: white;
          font-size: 0.85rem;
        }

        @media (min-width: 768px) {
          th {
            font-size: 1rem;
          }
        }

        tr:nth-child(even) {
          background-color: #f9f9f9;
        }

        .appendix-link {
          color: #4a4a8a;
          font-size: 0.9em;
          font-style: italic;
        }

        a {
          color: #4a4a8a;
          word-break: break-word;
        }

        a:hover {
          color: #2d2d5a;
        }

        .proposal-section {
          background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e9 100%);
          padding: 16px;
          border-radius: 8px;
          margin: 20px 0;
        }

        @media (min-width: 768px) {
          .proposal-section {
            padding: 30px;
            margin: 40px 0;
          }
        }

        .offering-list, .need-list {
          background-color: white;
          padding: 12px;
          border-radius: 5px;
          margin: 12px 0;
          font-size: 0.9rem;
        }

        @media (min-width: 768px) {
          .offering-list, .need-list {
            padding: 20px;
            margin: 15px 0;
            font-size: 1rem;
          }
        }

        .offering-list {
          border-left: 4px solid #4caf50;
        }

        .need-list {
          border-left: 4px solid #2196f3;
        }

        .summary-box {
          background-color: #fff8e1;
          padding: 16px;
          border-radius: 8px;
          border: 2px solid #ffc107;
          margin: 20px 0;
        }

        @media (min-width: 768px) {
          .summary-box {
            padding: 25px;
            margin: 40px 0;
          }
        }

        .non-negotiable {
          background-color: #ffebee;
          padding: 12px;
          border-radius: 5px;
          border-left: 4px solid #f44336;
          font-size: 0.9rem;
        }

        @media (min-width: 768px) {
          .non-negotiable {
            padding: 15px;
            font-size: 1rem;
          }
        }

        .appendix {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 3px solid #4a4a8a;
        }

        @media (min-width: 768px) {
          .appendix {
            margin-top: 60px;
            padding-top: 40px;
          }
        }

        .appendix h2 {
          color: #1a1a2e;
        }

        .appendix-section {
          margin-bottom: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .appendix-section {
            margin-bottom: 15px;
          }
        }

        .appendix-toggle {
          width: 100%;
          padding: 12px 14px;
          background-color: #f5f5f5;
          border: none;
          text-align: left;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          color: #2d2d5a;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: background-color 0.2s;
        }

        @media (min-width: 768px) {
          .appendix-toggle {
            padding: 15px 20px;
            font-size: 1rem;
          }
        }

        .appendix-toggle:hover {
          background-color: #e8e8f0;
        }

        .appendix-toggle-icon {
          font-size: 1rem;
          font-weight: bold;
          width: 22px;
          height: 22px;
          min-width: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #4a4a8a;
          color: white;
          border-radius: 4px;
        }

        @media (min-width: 768px) {
          .appendix-toggle-icon {
            font-size: 1.2rem;
            width: 24px;
            height: 24px;
            min-width: 24px;
          }
        }

        .appendix-content {
          padding: 16px;
          background-color: #fafafa;
          border-top: 1px solid #ddd;
          font-size: 0.9rem;
        }

        @media (min-width: 768px) {
          .appendix-content {
            padding: 20px;
            font-size: 1rem;
          }
        }

        .appendix-content h3 {
          margin-top: 16px;
        }

        @media (min-width: 768px) {
          .appendix-content h3 {
            margin-top: 20px;
          }
        }

        .appendix-content h3:first-child {
          margin-top: 0;
        }

        .source-list {
          background-color: #f5f5f5;
          padding: 12px;
          border-radius: 5px;
        }

        @media (min-width: 768px) {
          .source-list {
            padding: 20px;
          }
        }

        .source-list a {
          display: block;
          margin: 8px 0;
          font-size: 0.8rem;
          word-break: break-word;
        }

        @media (min-width: 768px) {
          .source-list a {
            font-size: 0.9rem;
          }
        }

        ul, ol {
          padding-left: 18px;
        }

        @media (min-width: 768px) {
          ul, ol {
            padding-left: 25px;
          }
        }

        li {
          margin: 6px 0;
        }

        @media (min-width: 768px) {
          li {
            margin: 8px 0;
          }
        }

        .signature {
          margin-top: 30px;
          font-style: italic;
        }

        @media (min-width: 768px) {
          .signature {
            margin-top: 40px;
          }
        }

        .video-section {
          margin-top: 30px;
          padding: 16px;
          background: linear-gradient(135deg, #1a1a2e 0%, #4a4a8a 100%);
          border-radius: 8px;
          text-align: center;
        }

        @media (min-width: 768px) {
          .video-section {
            margin-top: 60px;
            padding: 30px;
          }
        }

        .video-section h2 {
          color: white;
          border: none;
          margin-bottom: 16px;
          font-size: 1.2rem;
        }

        @media (min-width: 768px) {
          .video-section h2 {
            margin-bottom: 20px;
            font-size: 1.5rem;
          }
        }

        .video-section video {
          width: 100%;
          max-width: 100%;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .document-footer {
          text-align: center;
          margin-top: 30px;
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        @media (min-width: 768px) {
          .document-footer {
            margin-top: 60px;
            padding: 20px;
            font-size: 1rem;
          }
        }

        .important-note {
          margin-top: 10px;
        }

        /* Ensure full-width layout on mobile */
        @media (max-width: 767px) {
          body {
            margin: 0;
            padding: 0;
          }

          p {
            font-size: 0.95rem;
            line-height: 1.6;
          }
        }
      `}</style>

      <div className="header">
        <h1>CONTRACT & COMPENSATION DISCUSSION</h1>
        <p>Will Welsh | Tech Integration Labs LLC</p>
        <p>December 2025</p>
      </div>

      <div className="video-notice">
        <p>📹 <strong>Video Message Below:</strong> There is a personal video message at the bottom of this document. <a onClick={scrollToVideo}>Click here to jump to video →</a></p>
      </div>

      <div className="intro">
        <p>Josh,</p>
        <p>I need to address several things about my contract and compensation. I'm going to go through the issues you've raised point by point, give you my responses, and then present my proposal for how we move forward.</p>
        <p>For each topic, I've included links to detailed documentation and research in the appendix if you want to dig deeper.</p>
      </div>

      <div className="section">
        <h2>Industry Cost Analysis & The "Vibe Coder" Question</h2>

        <p>Before we get into the specific issues, I want to share some important context. Somewhere along the way, a disconnect has developed between what I'm actually delivering and how that work is being perceived.</p>

        <p>Recently, the company turned down a dentist app project (Elite Dental Force) due to liability concerns, risk concerns, and the belief that I—referred to as a "vibe coder"—wouldn't be capable of building it. This decision was informed by consulting AI and calling large development agencies.</p>

        <p><strong>I decided to use the exact same methodology—consulting AI and getting agency estimates—but applied it to the work I've already completed.</strong> The results tell a very different story.</p>

        <h3>How I Got These Numbers</h3>
        <p>I want to be clear about my methodology—I didn't guide this analysis in any direction. I didn't write prompts designed to get high or low numbers. I simply provided AI with:</p>
        <ul>
          <li><strong>Full PRDs (Product Requirement Documents)</strong> for projects not yet built—the most accurate way to understand what an app will be in full context</li>
          <li><strong>Full repositories (actual codebases)</strong> for projects that have been built—the most accurate way to analyze what has actually been delivered</li>
        </ul>
        <p>These are the two most reliable inputs you can give AI to get back accurate estimates. I asked it to analyze them and provide real-world estimates based on large software agency pricing, documented past project builds of similar scope, and standard industry team compositions.</p>
        <p><strong>Importantly, I even asked it to account for how much faster and easier it is to build software today due to recent AI advancements.</strong> Despite factoring in AI-assisted development efficiencies, the estimates still came back in the ranges shown below.</p>

        <h3>What Traditional Agencies Would Actually Charge</h3>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Agency Cost</th>
              <th>Timeline</th>
              <th>Team Required</th>
              <th>My Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Elite Dental Force</strong> (turned down)</td>
              <td>$560,000 - $950,000</td>
              <td>9-15 months</td>
              <td>4-7 developers</td>
              <td>N/A - deal passed</td>
            </tr>
            <tr>
              <td><strong>Perdia AI Platform</strong></td>
              <td>$1,100,000 - $1,800,000</td>
              <td>9-14 months</td>
              <td>5-9 developers</td>
              <td><strong>90% complete in &lt;3 weeks</strong></td>
            </tr>
            <tr>
              <td><strong>Disruptors Marketing Hub</strong></td>
              <td>$800,000 - $1,500,000</td>
              <td>9-14 months</td>
              <td>6-10 developers</td>
              <td><strong>Live</strong> (called "incomplete")</td>
            </tr>
            <tr>
              <td><strong>SegPro Calculator</strong></td>
              <td>$160,000 - $320,000</td>
              <td>3-6 months</td>
              <td>3-5 developers</td>
              <td><strong>Completed</strong></td>
            </tr>
          </tbody>
        </table>

        <h3>Why These Projects Cost So Much</h3>
        <p>When people hear "website" or "web app," they instinctively compare it to a simple WordPress site. That's like comparing a Tesla factory to a car wash because they both use concrete.</p>

        <p><strong>DisruptorsMedia.com ($800K-$1.5M)</strong> isn't a website—it's a multi-tool marketing platform with: growth audit system, keyword research tools, content generators, Business Brain knowledge base, lead capture, and admin systems. Each is its own mini-app with AI orchestration, serverless functions, databases, plus hundreds of custom illustrations and videos. A WordPress site has 1-2 features; DisruptorsMedia.com has dozens.</p>

        <p><strong>Perdia ($1.1M-$1.8M)</strong> is even more complex because nothing like it exists anywhere. It's not just "AI that writes articles"—it's a 20+ step content factory that automates topic discovery, keyword research, drafting, SEO optimization, humanization, editor feedback, learning from corrections, and WordPress publishing. It maintains a complete memory of every article on the site so it doesn't repeat itself and learns to write better over time. You can't buy this as a product—it combines AI writer + SEO assistant + CMS + editorial platform + analytics engine into one system.</p>

        <p>To build either properly, agencies deploy 6-10 specialists (product leads, UX/UI designers, frontend/backend engineers, AI engineers, DevOps, QA, illustrators, video editors) at $150-$250+/hour. <strong>These are the kinds of products companies raise venture capital to build.</strong></p>

        <h3>The Contradiction</h3>
        <p><strong>The dentist app they said I couldn't build:</strong> $560K-$950K agency value, requires 4-7 developers over 9-15 months.</p>
        <p><strong>The Perdia app I'm actually building:</strong> $1.1M-$1.8M agency value, requires 5-9 developers over 9-14 months. <strong>I'm 90% complete in less than 3 weeks, working alone, for less than $4,000.</strong></p>
        <p>Perdia is valued at nearly <strong>twice</strong> what the dentist app would cost. It requires a <strong>larger team</strong> and <strong>similar timeline</strong>. But I supposedly can't handle the dentist app?</p>

        <h3>What the "Vibe Coder" Is Actually Delivering</h3>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Industry Value</th>
              <th>My Cost to DM</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SegPro Calculator</td>
              <td>$160K - $320K</td>
              <td>&lt; $4,000</td>
              <td><strong>Completed</strong></td>
            </tr>
            <tr>
              <td>Perdia AI Platform</td>
              <td>$1.1M - $1.8M</td>
              <td>&lt; $4,000</td>
              <td><strong>90% complete in &lt;3 weeks</strong></td>
            </tr>
            <tr>
              <td>Disruptors Marketing Hub</td>
              <td>$800K - $1.5M</td>
              <td>Included in salary</td>
              <td><strong>Live</strong> (called "incomplete")</td>
            </tr>
          </tbody>
        </table>
        <p><strong>Combined industry value: $2.06 million - $3.62 million</strong></p>
        <p><strong>Combined cost to Disruptors Media: ~$24,000</strong></p>
        <p>That's a cost efficiency ratio of <strong>85x to 150x</strong> compared to traditional agency pricing.</p>

        <h3>Same Method, Opposite Conclusions</h3>
        <p>The company consulted AI and agencies to determine whether a "vibe coder" could build the dentist app. The conclusion was no—too risky, not capable.</p>
        <p>I used the <strong>exact same method</strong> to analyze the actual work I've already delivered. The conclusion: I'm single-handedly producing millions of dollars worth of enterprise software at a tiny fraction of traditional costs.</p>
        <p><strong>Same method. Opposite conclusions.</strong> The difference? My analysis is based on <strong>actual deliverables</strong>—real codebases, real PRDs, real completed work. Not hypotheticals about what might go wrong.</p>

        <div className="my-position">
          <strong>The Real Question:</strong> The question isn't whether I can build complex applications—the evidence shows I already am. The real question is how this perception gap developed, and why work that's worth millions by industry standards is being characterized as not good enough, taking too long, or not generating direct revenue.
        </div>
      </div>

      <h1>PART 1: YOUR POINTS & MY RESPONSES</h1>

      <div className="section">
        <h2 id="section1">1. The $1,800 Deduction</h2>
        <p className="appendix-link">[See <a href="#appendix-a">Appendix A</a> for detailed documentation]</p>

        <div className="position-box">
          <strong>Your position:</strong> I "signed up for something" that resulted in $1,800 in API charges, so it's coming out of my pay.
        </div>

        <div className="response-box">
          <strong>My response:</strong>
          <p>That's not what happened. API keys aren't optional services I signed up for—they're essential infrastructure. Every app I build has 10-20+ keys. Without them, nothing works. APIs are to apps and websites what electricity is to a job site.</p>
          <p>API incidents happen constantly (39 million keys leaked on GitHub in 2024 alone—even Fortune 500 companies with dedicated security teams experience these incidents). Industry standard is that companies absorb these costs as operational overhead, not individual developers. I researched this extensively and could not find a single example of a company deducting API charges from a developer's paycheck. It's simply not done.</p>
          <p>There was never any agreement—written or verbal—that I would personally cover operational costs. And according to Utah labor law and federal regulations, employers cannot deduct amounts from wages without express written authorization—deductions for operational costs without clear voluntary agreement are generally prohibited.</p>
          <p>If I'm personally liable for API charges going forward, I would have to shut down every API key across every project immediately to protect myself. That would halt all development indefinitely. I don't think that's what you want.</p>
        </div>

        <div className="my-position">
          <strong>My position:</strong> The $1,800 needs to be reversed. I'm actively pursuing the refund from Google, which will be reimbursed directly to the company.
        </div>
      </div>

      <div className="section">
        <h2 id="section2">2. The Website "Not Being Complete"</h2>
        <p className="appendix-link">[See <a href="#appendix-b">Appendix B</a> for scope creep documentation]</p>

        <div className="position-box">
          <strong>Your position:</strong> The website was never completed, and since you've been good to me, I should finish it for free.
        </div>

        <div className="response-box">
          <strong>My response:</strong>
          <p>Here is a super simplified and condensed version of what actually happened: I designed the website. Then I got detailed page-by-page revisions from one person, applied them—which broke the visual coherence—so I had to redesign all the aesthetics around their requests until it all looked good again. Then I got a completely different set of revisions from someone else. This cycle repeated for weeks. Then the question came: "Why is this taking so long?"</p>
          <p>The website is complete. It's live and functional. We have received lots of feedback on it from clients and it's all been extremely positive. One client even said that part of the reason he chose us was because he liked how we designed our website (I know that was Kyle and Tyler's point about the old website, but the comment I'm referring to came from a recent client about the new site).</p>
          <p>You're telling me the website still isn't completed and tasking me with the responsibility of finally building the perfect version of it that you are envisioning. But when I ask you for details on what exactly is not complete you said something along the lines of "It doesn't tell our story perfectly." Based on my experience designing this site for you guys so far—the only way I will ever be able to produce the site you are envisioning (the site that you can feel good about considering complete and be happy with me about)—is if you give me:</p>
          <ol>
            <li><strong>Specific, written requirements</strong> — exactly what to change, page by page</li>
            <li><strong>One point of contact for feedback</strong> — not conflicting input from multiple people</li>
          </ol>
          <p>I'm happy to do more work on the website. But vague direction + multiple conflicting stakeholders = the exact cycle that made this take so long in the first place.</p>
          <p>For context: what happened with the website is textbook <strong>scope creep</strong>—the #1 cause of project delays and budget overruns in software and design. Research shows projects with unclear requirements take 2-3x longer than those with clear specs. That's why professional projects have discovery phases, defined revision rounds ("this price includes 2 rounds of revisions"), and change orders for additional work. Asking a developer to work until something is "perfect" with no clear definition of "perfect" is asking for infinite work.</p>
        </div>

        <div className="my-position">
          <strong>Important note:</strong> You guys have been amazing and understanding about the unexpected situation with my mom, and I sincerely appreciate that, and am more than willing to go above and beyond and reciprocate that same decency and good will back to you guys. That being said, I don't feel good at all about tying this in with things you are saying like that I never completed, or somehow failed in the website build. And to be honest, if you feel the current disruptorsmedia.com website that I built is a failure—I'm not sure what a win would look like to you.
        </div>
      </div>

      <div className="section">
        <h2 id="section3">3. "Not As Far Along With AI As You Thought"</h2>
        <p className="appendix-link">[See <a href="#appendix-c">Appendix C</a> for company growth documentation]</p>

        <div className="position-box">
          <strong>Your position:</strong> You said something along the lines of, <em>"I guess you weren't as far along with AI as you thought you were."</em>
        </div>

        <div className="response-box">
          <strong>My response:</strong>
          <p>That comment caught me off guard, and I fully disagree with it.</p>
          <p>The company didn't just grow—it transformed from a marketing agency to an AI-first development company. I'm not saying that pivot was built entirely on my work. But I think it's unreasonable to assume that this transformation, which happened over the course of the few months since I started, wasn't at least an indirect result of my contributions.</p>
          <p>You brought me on as an AI expert. I've taught Kyle and the team everything I know about AI and how to best use it, every single day I've worked here. I'm the only developer. No other technical staff. Managing 3-6 projects simultaneously, alone.</p>
          <p>We were at $18K MRR. We're now at $30K+ MRR, plus $15K+ in app deposits. In our initial phone conversations where you were telling me about pay and equity incentives that would be based on our MRR increasing, I asked you how you'd know if the growth was from me. Your response was that we're a three-person team, so where else would the increases in MRR come from.</p>
          <p>Rather than a lack of AI skills on my part, I think this perception can be attributed to a few things: the inherently unpredictable nature of AI development work, unrealistic expectations of what a one-person development team can deliver, and honestly—my own underwhelming communication skills. I'm not someone who demands credit where credit is due or escalates every obstacle. I'm used to working on teams of creators and engineers where failing fast is encouraged (as Elon always recommends), where we collaborate and solve problems together rather than constantly covering our own backs. That's served me well in those environments, but I recognize it may have left you without visibility into what I'm actually contributing here.</p>
          <p>For reference, here's what industry research says about realistic AI development timelines:</p>
          <table>
            <thead>
              <tr>
                <th>Project Type</th>
                <th>Realistic Timeline</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Simple AI chatbot (FAQ-style)</td>
                <td>4-8 weeks</td>
              </tr>
              <tr>
                <td>Basic AI app with existing APIs</td>
                <td>2-4 months</td>
              </tr>
              <tr>
                <td>Custom AI features with training</td>
                <td>3-6 months</td>
              </tr>
              <tr>
                <td>Complex enterprise AI application</td>
                <td>9-12+ months</td>
              </tr>
              <tr>
                <td>Novel/never-done-before features</td>
                <td>Add 2-4 weeks just for evaluation and tuning</td>
              </tr>
            </tbody>
          </table>
          <p>As one industry source put it: <em>"AI eats scope for breakfast—data pipelines, model eval loops, and privacy reviews can stretch timelines fast."</em></p>
        </div>
      </div>

      <div className="section">
        <h2 id="section4">4. The New Contract / Feeling Like My Work Isn't Creating Revenue</h2>
        <p className="appendix-link">[See <a href="#appendix-d">Appendix D</a> for industry compensation research]</p>

        <div className="position-box">
          <strong>Your position:</strong> You want to redo my contract, moving to the 50% of $250/hour model.
        </div>

        <div className="response-box">
          <strong>My response:</strong>
          <p>I did receive part of the raise you promised—my bi-weekly checks went from $2K to $2,750. But the push to redo my contract and the concern that my work isn't generating revenue doesn't match what the numbers show—MRR has grown 67%, we have $15K+ in app deposits, and the company has transformed into an AI-first business.</p>
          <p>You said when I joined:</p>
          <blockquote>"If I can see that we've gone from, yeah, I think we're at, like, 17, 8, let's just call it 18,000, and now we're at 36,000. I give you my word as a man that I will give you a $2,000 pay increase."</blockquote>
          <p>Here's the thing: 50% of $250/hour is the absolute minimum I'll accept. And here's why that's already generous on my part:</p>
          <ul>
            <li>I get 0% of initial down payments ($15K+ so far)</li>
            <li>I get 0% of recurring revenue ($3-5K/month per app, ongoing for years)</li>
            <li>I get 50% of the hourly rate we charge for development work—while doing 100% of the dev work</li>
          </ul>
          <p>For every billable hour, there's another hour of unbillable work (setup, research, testing, client emails). That $125/hour is really ~$62.50/hour of my actual time.</p>
          <p>For context on industry standards:</p>
          <ul>
            <li>Senior/specialized developers (AI, complex integrations) command $150-$250+/hour</li>
            <li>Agency rates for enterprise work often range $200-$400/hour</li>
            <li>AI app development costs range from $20,000-$250,000+ per project</li>
            <li>Staffing agencies typically take 30-50% of the billed rate, meaning contractors typically receive 50-70% of what clients pay</li>
          </ul>
          <p>At 50%, I'm at the low end of industry standard—while receiving nothing from down payments or recurring revenue.</p>
        </div>

        <div className="my-position">
          <strong>My position:</strong> I want either a share of down payments (10-20%) or a share of recurring revenue (10-20%). If I'm getting 0% of both, 50% hourly is the floor.
        </div>
      </div>

      <div className="section">
        <h2 id="section5">5. Equity</h2>
        <p className="appendix-link">[See <a href="#appendix-e">Appendix E</a> for original conversation quotes]</p>

        <div className="position-box">
          <strong>What you said when I joined:</strong>
          <blockquote>"That would mean that I would have 24% or something... if you're capable of doing those incredible things, yeah, I mean, I know that the entire team would not be opposed, if you can just absolutely crush it."</blockquote>
        </div>

        <div className="response-box">
          <strong>My response:</strong>
          <p>I accepted $48K/year—way below market—partly because of that conversation.</p>
          <p>I'm assuming equity is off the table now, given that it hasn't been mentioned a single time since the moment I agreed to your terms. I imagine it has something to do with the "not as far along with AI" comment.</p>
          <p>But if that's the perception, and if equity is no longer part of the picture, then the compensation structure needs to reflect that reality. I didn't accept below-market pay for the fun of it.</p>
          <p>You also said at the time:</p>
          <blockquote>"The reality is, Will, let's be honest, if you're not making a minimum of a quarter of a million a year, it's not enough."</blockquote>
          <blockquote>"There is an AI opportunity right now to be AI consultants and AI partners with tons of companies, because there's not enough people like us, right, and you, and Emerald Deacon, there's not enough people like them to facilitate the needs of all the companies out there. There just isn't."</blockquote>
          <p>I believed those things then, and I still believe them now. That's why I took this opportunity.</p>
        </div>
      </div>

      <div className="section">
        <h2 id="section6">6. Internal DM Work</h2>
        <p className="appendix-link">[See <a href="#appendix-f">Appendix F</a> for list of uncompensated work]</p>

        <div className="position-box">
          <strong>The issue:</strong> A significant portion of my work has no defined compensation.
        </div>

        <div className="response-box">
          <strong>My response:</strong>
          <p>How will I be compensated for:</p>
          <ul>
            <li>Teaching the team</li>
            <li>Website work (see above)</li>
            <li>Internal apps (Sniper Sales, Client Portal, Content Writer)</li>
            <li>GoHighLevel integrations</li>
            <li>Non-app client work (EVLogic HeyGen, etc.)</li>
          </ul>
          <p>This needs to be defined in writing.</p>
        </div>
      </div>

      <h1>PART 2: MY PROPOSAL</h1>

      <div className="proposal-section">
        <p className="appendix-link">[See <a href="#appendix-g">Appendix G</a> for professional liability insurance research]</p>

        <p>Josh, I know liability is a major concern for you. The API incident brought this into sharp focus. Here's my proposal to address everything:</p>

        <h2>What I'm Offering — Structured Like a Real Dev Vendor</h2>

        <p>Josh, if your main concern is liability with clients, we can structure this like a professional development vendor relationship. Let me explain what that actually means in the industry, because "taking on liability" doesn't mean what most people think.</p>

        <h3>What "Taking On Liability" Actually Means in the Industry</h3>

        <p>Nobody in software says "I'll take unlimited personal liability for anything that goes wrong." That would be insane. Instead, real dev companies do three things:</p>

        <div className="offering-list">
          <p><strong>1. Use an entity, not a person</strong></p>
          <p>The vendor is the company (Tech Integration Labs LLC), not the individual developer. That's what my LLC is for—it's the contracting party, not "Will personally."</p>
        </div>

        <div className="offering-list">
          <p><strong>2. Carry Professional Liability Insurance (Tech E&O)</strong></p>
          <p>This is called:</p>
          <ul>
            <li>Technology Errors & Omissions (E&O)</li>
            <li>Professional liability insurance</li>
            <li>Professional indemnity insurance</li>
          </ul>
          <p>It's designed for exactly this scenario. If a client claims our software error, negligence, or bad advice caused them financial loss, the insurance covers:</p>
          <ul>
            <li>Legal defense costs</li>
            <li>Settlements/judgments, up to policy limits</li>
          </ul>
        </div>

        <div className="offering-list">
          <p><strong>3. Limit Liability in the Contract (This is HUGE)</strong></p>
          <p>Standard software contracts have a <strong>limitation of liability clause</strong> that:</p>
          <ul>
            <li>Caps total liability to something like "fees paid under this contract in the last 12 months" or "2x the total fees paid"</li>
            <li>Excludes certain damages (no liability for "indirect, consequential, lost profits," etc.)</li>
          </ul>
          <p>This is how actual vendors avoid "one bad incident ruins the company" risk.</p>
        </div>

        <h3>So When Actual Dev Shops "Take On Liability," It Means:</h3>

        <blockquote>
          "Our company will be legally responsible up to a defined cap for issues caused by our negligence, backed by professional liability insurance, and defined in the contract."
        </blockquote>

        <p><strong>NOT:</strong> <em>"I personally will eat any and all losses no matter what happens."</em></p>

        <h3>How I Would Structure This with Tech Integration Labs</h3>

        <div className="offering-list">
          <p><strong>Tech Integration Labs LLC</strong> becomes the contracted development vendor:</p>
          <ul>
            <li>Disruptors Media: marketing, client relationship, billing front</li>
            <li>Tech Integration Labs LLC: contracted dev vendor</li>
          </ul>

          <p><strong>I carry Tech E&O / professional indemnity insurance:</strong></p>
          <ul>
            <li>If a client claims financial loss due to development work, that's covered by my policy, not by Disruptors Media</li>
          </ul>

          <p><strong>We use standard limitation-of-liability language in our contract:</strong></p>
          <ul>
            <li>Cap liability to fees paid in last 12 months, or 1-2x total project fees</li>
            <li>Exclude indirect damages, etc.</li>
          </ul>
        </div>

        <h3>The Bottom Line on Liability</h3>

        <div className="my-position">
          <p>With this structure, I can say:</p>
          <blockquote>
            "If your main concern is liability with the client, we can structure this like an actual dev vendor relationship: Tech Integration Labs is the development vendor. I carry Tech E&O/professional liability insurance. Our contract has a standard limitation-of-liability cap. That means development-related liability is handled on my side instead of on DM's books—but it's handled professionally, not as some vague personal promise."
          </blockquote>
          <p>That's competent, grown-up, and very different from "I'll just personally be responsible for everything."</p>
        </div>

        <h2>How to Handle "Never-Been-Done-Before" Work</h2>

        <p>For complex apps and future novel projects, here's how professional dev shops handle uncertain, first-of-its-kind work:</p>

        <h3>Discovery / Scoping Phase (Paid)</h3>

        <div className="offering-list">
          <p>Before the full build, sell a <strong>Discovery Phase</strong> or <strong>Discovery + Architecture</strong> engagement:</p>
          <ul>
            <li><strong>Time-boxed:</strong> 2-6 weeks</li>
            <li><strong>Fixed fee or small T&M budget</strong></li>
            <li><strong>Deliverables:</strong>
              <ul>
                <li>Clarified requirements</li>
                <li>Technical feasibility analysis</li>
                <li>Candidate architectures/tools</li>
                <li>Risks identified</li>
                <li>Estimated ranges for time & cost</li>
              </ul>
            </li>
          </ul>
          <p>The sales line is: <em>"If we don't understand it properly, we're both flying blind. Discovery reduces risk for everyone."</em></p>
        </div>

        <h3>Proof of Concept (PoC) / Spike Work</h3>

        <div className="offering-list">
          <p>When something is truly novel or technically risky:</p>
          <p><strong>Define a PoC focused on the hard part only:</strong></p>
          <ul>
            <li>One key algorithm</li>
            <li>A critical integration</li>
            <li>A workflow that might or might not be possible</li>
          </ul>

          <p><strong>Key attributes:</strong></p>
          <ul>
            <li><strong>Time-boxed:</strong> A few days to a few weeks</li>
            <li><strong>Narrow in scope:</strong> "Can we get X working in a basic way?"</li>
            <li><strong>Paid:</strong> This is billable work, not free experimentation</li>
            <li><strong>Clearly defined success criteria:</strong> "PoC is successful if we can reliably do X with Y latency/accuracy."</li>
            <li><strong>Limited, controlled cost:</strong> "We'll spend up to N hours / $N on this PoC."</li>
          </ul>

          <p><strong>Outcome-driven:</strong></p>
          <ul>
            <li>If PoC succeeds → proceed to full build with updated estimates</li>
            <li>If it fails → you and the client both learned it's not feasible before burning $150k</li>
          </ul>

          <p>This is standard practice in complex/AI work. Agencies use terms like "Discovery & PoC," "Exploratory spike," or "Technical feasibility phase."</p>
        </div>

        <h3>Using a Complex App as an Example</h3>

        <div className="my-position">
          <p>Here's how this might work:</p>
          <ol>
            <li>Sell a Discovery/PoC phase first, maybe $10-25k, focused on proving the hardest part</li>
            <li>Use what we learn there to tighten the estimate on the full build</li>
          </ol>
          <p>That's how actual agencies or dev companies do it, and clients are usually fine with it when you explain you're protecting their risk too.</p>
        </div>

        <h2>Summary: What I'm Offering</h2>

        <div className="offering-list">
          <p>Through <strong>Tech Integration Labs LLC</strong>, I will:</p>
          <ol>
            <li><strong>Act as the development vendor</strong> — entity-to-entity relationship</li>
            <li><strong>Carry Tech E&O / professional liability insurance</strong> — development-related liability covered by my policy</li>
            <li><strong>Use standard limitation-of-liability contract language</strong> — capped exposure, excluded damages</li>
            <li><strong>Cover all AI subscriptions and API costs myself</strong> — These are the same subscriptions we're already paying through Disruptors Media (Claude, ChatGPT, Google Cloud, etc.). The ~$500-700/month is the absolute minimum needed to build all this stuff efficiently. And to be clear: these subscriptions and their associated API credits are the exact thing that resulted in the $1,800 charge. Under this structure, all of that would be on my accounts, not yours.
              <p className="important-note"><strong>Important:</strong> If I'm expected to take on risks like API leaks (the $1,800 incident), then this is how it needs to be set up. The person who bears the risk needs to control the accounts. That's standard in the industry—you can't hold someone liable for costs on accounts they don't control. This structure solves that problem cleanly: I control the accounts, I bear the risk, and Disruptors Media has zero exposure.</p></li>
            <li><strong>Manage and pay software developer freelancers</strong> when their expertise is needed to complete a project</li>
            <li><strong>Manage all technical accounts and infrastructure</strong> — You won't be liable or responsible for any fees, risks, or complexities associated with these accounts. No more shared account concerns or confusion about who's responsible for what.</li>
            <li><strong>Implement Discovery/PoC phases</strong> for novel work — de-risk projects before full commitment</li>
          </ol>
          <p><strong>This removes liability from Disruptors Media entirely—handled professionally, like an actual vendor relationship.</strong></p>
        </div>

        <h2>What I Need in Return</h2>
        <div className="need-list">
          <ol>
            <li><strong>50% of hourly fees for actual development</strong> — this is the minimum, non-negotiable. The hourly rate we charge clients should be close to $250, which is standard and expected for this type of work. We can communicate to clients that they can expect considerably fewer hourly dev hours billed because we're using AI to build it. I'll also be using AI-powered time tracking software that tracks actual work done down to the minute, so you'll get very accurate hourly billing with detailed breakdowns of exactly what was worked on each hour—full transparency. <strong>To put this in perspective: 50% means you're getting paid exactly as much as I am for every hour of actual development work I complete.</strong></li>
            <li><strong>10-20% of initial down payments</strong> — I do significant upfront work to close these deals <em>(open to negotiation)</em></li>
            <li><strong>10-20% of recurring revenue</strong> — the apps I build generate income for years <em>(open to negotiation)</em></li>
            <li><strong>Written compensation terms for internal DM work</strong> — no more ambiguity
              <p className="important-note"><strong>Important caveat:</strong> This is where the good faith and repayment for being good to me comes in. I genuinely like Kyle, Tyler, Josh, and the company itself—I really mean that. And I appreciate many aspects of how I've been treated thus far. Because of that, I'm happy to help out the company without pay in many ways that are reasonable and agreed upon under friendly terms. This includes things like helping with Disruptors Connect events, consulting, and training anytime now and in the future. But it needs to be in a friendly and respectful manner—not "we need you here by this time and you will be expected to have trained us on X and Y by the end of this meeting." There's a big difference between asking for help and demanding it with an implication of failure on my part.</p></li>
            <li><strong>The $1,800 deduction reversed</strong> — Google will reimburse directly to the company</li>
            <li><strong>Everything in writing going forward</strong> — no more verbal agreements that get reinterpreted</li>
          </ol>
        </div>

        <h2>Why This Works for Both of Us</h2>

        <p>This isn't just about what I need—this structure genuinely benefits both sides. Let me break it down:</p>

        <h3>For Disruptors Media:</h3>
        <div className="offering-list">
          <ol>
            <li><strong>Zero liability exposure on the technical side</strong> — All development-related liability is handled through Tech Integration Labs LLC, backed by professional insurance and standard contract language. If something goes wrong with a client project, it's on my books, not yours.</li>
            <li><strong>No surprise API charges hitting your accounts</strong> — The $1,800 incident can never happen again because those accounts won't be on your credit card. All subscriptions, API costs, and technical infrastructure costs are my responsibility.</li>
            <li><strong>Predictable costs</strong> — You know exactly what you're paying: 50% of billable development hours. No hidden surprises, no unexpected invoices for tools or services.</li>
            <li><strong>Full transparency on hours and deliverables</strong> — AI-powered time tracking gives you detailed breakdowns of exactly what was worked on, down to the minute. You can see exactly where every hour goes.</li>
            <li><strong>Professional vendor relationship</strong> — This is how actual agencies and dev companies structure their partnerships. It's clean, it's professional, and it protects both parties.</li>
            <li><strong>You get paid as much as I do</strong> — For every hour of development work, you're earning the same amount I am. That's a 50/50 split on the actual work.</li>
            <li><strong>Access to help and training without the overhead</strong> — I'm genuinely happy to help with Disruptors Connect events, consulting, and training under friendly terms. You get the benefit of my expertise without having to pay for every conversation.</li>
          </ol>
        </div>

        <h3>For Me:</h3>
        <div className="need-list">
          <ol>
            <li><strong>Fair compensation that reflects the risk I'm taking on</strong> — I'm absorbing liability, paying for subscriptions, managing freelancers, and handling all the technical complexity. The compensation needs to match that.</li>
            <li><strong>Clear terms I can count on</strong> — No more verbal agreements that get reinterpreted. Everything in writing means we both know exactly where we stand.</li>
            <li><strong>The ability to operate professionally as a true subcontractor</strong> — This structure lets me run Tech Integration Labs LLC as a real business, which means I can invest in better tools, bring in help when needed, and deliver better results.</li>
            <li><strong>Control over the things I'm responsible for</strong> — If I'm bearing the risk on accounts and infrastructure, I need to be the one managing them. That's only fair.</li>
            <li><strong>A sustainable working relationship</strong> — I want this to work long-term. That means it needs to be structured in a way that's fair to both of us, not just one side.</li>
            <li><strong>The autonomy to do my best work</strong> — This might be the most important point, and the one that could have the most significant impact moving forward. I'm able to deliver significantly better results when I have the freedom to execute the way I know works best. This structure gives me that autonomy while still keeping you fully informed through transparent reporting. You get better outcomes without needing to manage the technical details.</li>
          </ol>
        </div>
      </div>

      <div className="summary-box">
        <h2>SUMMARY</h2>

        <div className="non-negotiable">
          <h3>Non-Negotiables:</h3>
          <ol>
            <li>$1,800 deduction reversed</li>
            <li>50% of hourly minimum</li>
            <li>Written terms for internal work</li>
            <li>No unauthorized deductions going forward</li>
          </ol>
        </div>

        <h3>The Bottom Line:</h3>
        <p>I want this to work. I believe in what we're building. But it needs to work for both of us.</p>
        <p>Let's discuss.</p>

        <p className="signature">—Will</p>
      </div>

      <div className="appendix" id="appendices">
        <h1>APPENDICES: DETAILED DOCUMENTATION & RESEARCH</h1>
        <p style={{marginBottom: '20px', color: '#666'}}>Click on each appendix to expand/collapse the content.</p>

        <CollapsibleAppendix id="appendix-a" title="APPENDIX A: The $1,800 API Deduction — Detailed Analysis">
          <h3>A.1 What Is an API Key?</h3>
          <p>Think of an API key like a password that lets one piece of software talk to another.</p>
          <p>When you use an app on your phone that shows you the weather, that app doesn't have its own weather satellites. It uses an API key to ask Google or Apple's weather service, "Hey, what's the weather in Boise?" The weather service checks the key, confirms it's legitimate, and sends back the answer.</p>
          <p><strong>Every modern app works this way.</strong> Apps don't exist in isolation—they connect to dozens of external services:</p>
          <ul>
            <li>AI services (Google Gemini, OpenAI, Claude)</li>
            <li>Payment processors</li>
            <li>Email services</li>
            <li>Database services</li>
            <li>Authentication services</li>
            <li>Analytics</li>
            <li>Maps</li>
            <li>And dozens more</li>
          </ul>
          <p><strong>Each of those connections requires an API key.</strong></p>
          <p>The apps I'm building for Disruptors Media each have <strong>10-20+ API keys</strong> connecting them to various services. Without these keys, the apps literally cannot function.</p>

          <h3>A.2 API Incidents Are Extremely Common</h3>
          <p><strong>Industry statistics:</strong></p>
          <ul>
            <li><strong>39 million API secrets were leaked on GitHub alone in 2024</strong></li>
            <li><strong>40% of API keys across the industry are stored in ways that could be exposed</strong></li>
            <li>Even Fortune 500 companies with dedicated security teams experience API key incidents</li>
            <li>The average cost of a mobile application security incident ranges from just under $1 million to several million dollars</li>
          </ul>

          <h3>A.3 How Companies Normally Handle This</h3>
          <p>In every professional software organization, <strong>the company absorbs these costs as operational overhead.</strong> Here's why:</p>
          <ol>
            <li><strong>It's a known risk of doing business</strong> - If you're building software, API incidents are a "when," not an "if"</li>
            <li><strong>Developers aren't negligent</strong> - These incidents happen even with best practices</li>
            <li><strong>The company has the resources</strong> - Individual developers often can't absorb thousands in surprise costs</li>
            <li><strong>It would be unworkable otherwise</strong> - If developers were personally liable, no one would take development jobs</li>
          </ol>
          <p><strong>I researched this extensively and could not find a single example of a company deducting API charges from a developer's paycheck. It's simply not done.</strong></p>

          <h3>A.4 What Labor Law Says About Deductions</h3>
          <p>According to Utah labor law (and federal regulations under 29 CFR 4.168):</p>
          <ul>
            <li>Employers cannot deduct amounts from wages without express written authorization</li>
            <li>Deductions for equipment damage, operational costs, or shortages without clear voluntary agreement are generally prohibited</li>
            <li>This applies whether someone is classified as an employee or, in many cases, a contractor</li>
          </ul>

          <div className="source-list">
            <strong>Sources:</strong>
            <a href="https://www.gitguardian.com/remediation/google-api-key" target="_blank" rel="noopener noreferrer">GitGuardian - Remediating Google API Key Leaks</a>
            <a href="https://www.wallarm.com/what/api-tokens-leaks" target="_blank" rel="noopener noreferrer">Wallarm - API Token Leaks Guide</a>
            <a href="https://nordicapis.com/keep-api-keys-safe-because-the-repercussions-are-huge/" target="_blank" rel="noopener noreferrer">Nordic APIs - Keep API Keys Safe</a>
            <a href="https://laborcommission.utah.gov/" target="_blank" rel="noopener noreferrer">Utah Labor Commission - Wage Regulations</a>
            <a href="https://www.ecfr.gov/current/title-29/subtitle-A/part-4/subpart-D/subject-group-ECFR2c50d9c2d69b435/section-4.168" target="_blank" rel="noopener noreferrer">Federal Register 29 CFR 4.168</a>
            <a href="https://www.dol.gov/agencies/whd/fact-sheets/78d-h2b-deductions" target="_blank" rel="noopener noreferrer">DOL Fact Sheet 78D</a>
          </div>
        </CollapsibleAppendix>

        <CollapsibleAppendix id="appendix-b" title="APPENDIX B: The Website — Scope Creep Documentation">
          <h3>B.1 What Happened</h3>
          <ol>
            <li>I designed the website (Version 1)</li>
            <li>One boss provided a full list of revisions—page by page, tabs, text changes, color changes</li>
            <li>I applied those revisions, which broke the visual coherence (changing one color affects everything around it)</li>
            <li>I had to redesign sections to make it look good again while keeping the new revisions</li>
            <li>By the time that was done, another boss provided a completely different list of revisions</li>
            <li>Repeat the entire process</li>
            <li>This went on for weeks</li>
          </ol>
          <p>Then the question came: "Why is this taking so long?"</p>

          <h3>B.2 What Is Scope Creep?</h3>
          <p><strong>Scope creep</strong> is one of the most common problems in software and design projects. It's when requirements keep changing or expanding after work has begun.</p>
          <p>Here's what research shows about scope creep:</p>
          <ul>
            <li>It's the #1 cause of project delays and budget overruns</li>
            <li>Projects with unclear requirements take 2-3x longer than those with clear specs</li>
            <li>The solution is <strong>change management</strong>—any new request gets documented, estimated, and approved before work begins</li>
          </ul>

          <h3>B.3 Why "Perfect" Is Impossible Without Clear Direction</h3>
          <p>Even if you tell me exactly what to write, once you see it, you'll probably realize it's not quite what you wanted. That's normal. That's why professional projects have:</p>
          <ul>
            <li><strong>Discovery phases</strong> - To understand the vision before building</li>
            <li><strong>Wireframes and mockups</strong> - To approve direction before full implementation</li>
            <li><strong>Defined revision rounds</strong> - "This price includes 2 rounds of revisions"</li>
            <li><strong>Change orders</strong> - Additional work beyond scope gets quoted separately</li>
          </ul>
          <p>Asking a developer to work until something is "perfect" with no clear definition of "perfect" is asking for infinite work.</p>
        </CollapsibleAppendix>

        <CollapsibleAppendix id="appendix-c" title="APPENDIX C: Industry Compensation Research">
          <h3>C.1 Standard Hourly Rates</h3>
          <p>Research shows:</p>
          <ul>
            <li>Senior/specialized developers (AI, complex integrations) command $150-$250+/hour</li>
            <li>Agency rates for enterprise work often range $200-$400/hour</li>
            <li>AI app development costs range from $20,000-$250,000+ per project</li>
          </ul>

          <h3>C.2 Revenue Share Arrangements</h3>
          <p>Research shows that staffing agencies typically take 30-50% of the billed rate as their cut, meaning contractors typically receive 50-70% of what clients pay.</p>
          <p>At 50%, I'm at the low end of industry standard—while receiving nothing from down payments or recurring revenue.</p>

          <h3>C.3 AI App Development Timelines</h3>
          <table>
            <thead>
              <tr>
                <th>Project Type</th>
                <th>Realistic Timeline</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Simple AI chatbot (FAQ-style)</td>
                <td>4-8 weeks</td>
              </tr>
              <tr>
                <td>Basic AI app with existing APIs</td>
                <td>2-4 months</td>
              </tr>
              <tr>
                <td>Custom AI features with training</td>
                <td>3-6 months</td>
              </tr>
              <tr>
                <td>Complex enterprise AI application</td>
                <td>9-12+ months</td>
              </tr>
              <tr>
                <td>Novel/never-done-before features</td>
                <td>Add 2-4 weeks just for evaluation and tuning</td>
              </tr>
            </tbody>
          </table>

          <div className="source-list">
            <strong>Sources:</strong>
            <a href="https://www.fullstack.com/labs/resources/blog/2024-price-guide" target="_blank" rel="noopener noreferrer">FullStack Labs - 2024 Software Development Price Guide</a>
            <a href="https://geomotiv.com/blog/software-engineer-hourly-rate-in-the-usa/" target="_blank" rel="noopener noreferrer">Geomotiv - Software Engineer Hourly Rate USA</a>
            <a href="https://topflightapps.com/ideas/ai-app-development/" target="_blank" rel="noopener noreferrer">TopFlight Apps - AI App Development Guide</a>
            <a href="https://www.ziprecruiter.com/Salaries/Software-Developer-Contractor-Salary" target="_blank" rel="noopener noreferrer">ZipRecruiter - Software Developer Contractor Salary</a>
            <a href="https://www.glassdoor.com/Salaries/software-engineer-contractor-salary-SRCH_KO0,28.htm" target="_blank" rel="noopener noreferrer">Glassdoor - Software Engineer Contractor Salary</a>
          </div>
        </CollapsibleAppendix>

        <CollapsibleAppendix id="appendix-d" title="APPENDIX D: Original Conversation Quotes">
          <h3>D.1 On Equity</h3>
          <blockquote>"That would mean that I would have 24% or something... It depends on what you're capable of. For sure, sure. I mean, if you're capable of doing those incredible things, yeah, I mean, I know that the entire team would not be opposed, if you can just absolutely crush it."</blockquote>
          <blockquote>"It probably depends on how well it does, huh?"</blockquote>

          <h3>D.2 On Pay Increases</h3>
          <blockquote>"If I can see that we've gone from, yeah, I think we're at, like, 17, 8, let's just call it 18,000, and now we're at 36,000. I give you my word as a man that I will give you a $2,000 pay increase."</blockquote>
          <blockquote>"For every 5,000 that we go up, you get 500 of it."</blockquote>
          <blockquote>"When we get this then you would go to $4,500 a month... And then when we hit 30,000, every 5,000 gross the company goes up, you would get an additional $500 till you hit 6K."</blockquote>

          <h3>D.3 On the $250K Benchmark</h3>
          <blockquote>"The reality is, Will, let's be honest, if you're not making a minimum of a quarter of a million a year, it's not enough."</blockquote>

          <h3>D.4 On Who Absorbs Operational Costs</h3>
          <blockquote>"So our total operating overhead is about 10,000 a month... And we could do that for literally years."</blockquote>
          <blockquote>"We are literally to bring you on, pulling $1,000 a month out of savings."</blockquote>

          <h3>D.5 On My Status as an Independent Contractor</h3>
          <blockquote>"So you're an independent contractor, so I'll just be blunt... I have no say in your schedule, and I legally, because you're an independent contractor."</blockquote>

          <h3>D.6 On the Scarcity of Talent</h3>
          <blockquote>"There is an AI opportunity right now to be AI consultants and AI partners with tons of companies, because there's not enough people like us, right, and you, and Emerald Deacon, there's not enough people like them to facilitate the needs of all the companies out there. There just isn't."</blockquote>
        </CollapsibleAppendix>

        <CollapsibleAppendix id="appendix-e" title="APPENDIX E: Uncompensated Internal Work">
          <table>
            <thead>
              <tr>
                <th>Work Type</th>
                <th>Examples</th>
                <th>Time Spent</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Teaching the team</td>
                <td>Training sessions (2+ hours this last Monday afternoon alone)</td>
                <td>Ongoing</td>
              </tr>
              <tr>
                <td>Website work</td>
                <td>Disruptors Media website development</td>
                <td>Weeks</td>
              </tr>
              <tr>
                <td>Internal apps</td>
                <td>Sniper Sales App, Client Portal, Content Writer Template</td>
                <td>Significant</td>
              </tr>
              <tr>
                <td>GoHighLevel integrations</td>
                <td>Various automations and workflows</td>
                <td>Ongoing</td>
              </tr>
              <tr>
                <td>Non-app client work</td>
                <td>EVLogic's digital avatar/HeyGen work</td>
                <td>Project-based</td>
              </tr>
            </tbody>
          </table>
        </CollapsibleAppendix>

        <CollapsibleAppendix id="appendix-f" title="APPENDIX F: Professional Liability Insurance Research">
          <h3>F.1 What Is Tech E&O Insurance?</h3>
          <p>Technology Errors & Omissions (Tech E&O) Insurance is a specialized form of professional liability coverage tailored for tech companies. It protects businesses against claims resulting from mistakes, oversights, or failures in their products or services.</p>

          <h3>F.2 What Does It Cover?</h3>
          <ul>
            <li>Errors, omissions, and negligent acts in technology services</li>
            <li>Software bugs and service outages</li>
            <li>Data mishandling</li>
            <li>Intellectual property disputes</li>
            <li>Certain cyber-related incidents</li>
          </ul>

          <div className="source-list">
            <strong>Sources:</strong>
            <a href="https://www.insureon.com/technology-business-insurance/software-developers" target="_blank" rel="noopener noreferrer">Insureon - Software Developer Insurance</a>
            <a href="https://www.thehartford.com/professional-liability-insurance/errors-omissions-insurance/technology" target="_blank" rel="noopener noreferrer">The Hartford - Technology E&O Insurance</a>
            <a href="https://www.techinsurance.com/technology-business-insurance/software-development" target="_blank" rel="noopener noreferrer">TechInsurance - Software Developer Insurance</a>
          </div>
        </CollapsibleAppendix>

        <CollapsibleAppendix id="appendix-g" title="APPENDIX G: Agile Development & Client Pricing">
          <h3>G.1 How Agile Pricing Works</h3>
          <blockquote>"When a project's scope is subject to change due to early user feedback, evolving customer requirements, or other factors, the development cost can be bound to agreed rates and the efforts experts spend to introduce deliverables, so the client only pays for actual work done."</blockquote>
          <blockquote>"Although it's impossible to predict the exact scope of work early on, mature project management practices help accurately define the baseline scope and give realistic estimates from the start."</blockquote>

          <h3>G.2 Discovery Phases & Proof of Concept</h3>
          <p>For projects involving novel features—things that have never been done before—professional development companies use paid discovery phases and proofs of concept.</p>
          <blockquote>"The pre-development stage, first of all, aims to eliminate financial risks for the client and make the development process as predictable and smooth as possible."</blockquote>
          <blockquote>"If the solution employs cutting-edge technologies or APIs that haven't been used for this purpose before, a PoC will help test its feasibility."</blockquote>

          <div className="source-list">
            <strong>Sources:</strong>
            <a href="https://www.toptal.com/agile/software-costs-estimation-in-agile-project-management" target="_blank" rel="noopener noreferrer">Toptal - Software Costs Estimation in Agile</a>
            <a href="https://aida.mitre.org/agile/agile-cost-estimation/" target="_blank" rel="noopener noreferrer">MITRE - Agile Cost Estimation</a>
            <a href="https://stfalcon.com/en/blog/post/discovery-phase" target="_blank" rel="noopener noreferrer">Stfalcon - Discovery Phase in Software Development</a>
            <a href="https://designli.co/blog/5-steps-proof-concept-successful-software-development/" target="_blank" rel="noopener noreferrer">Designli - Proof of Concept in Software Development</a>
          </div>
        </CollapsibleAppendix>

        <CollapsibleAppendix id="appendix-h" title="APPENDIX H: Full Source Reference List">
          <h3>Compensation & Revenue Share</h3>
          <div className="source-list">
            <a href="https://www.ziprecruiter.com/Salaries/Software-Developer-Contractor-Salary" target="_blank" rel="noopener noreferrer">ZipRecruiter - Software Developer Contractor Salary</a>
            <a href="https://www.glassdoor.com/Salaries/software-engineer-contractor-salary-SRCH_KO0,28.htm" target="_blank" rel="noopener noreferrer">Glassdoor - Software Engineer Contractor Salary</a>
            <a href="https://www.fullstack.com/labs/resources/blog/2024-price-guide" target="_blank" rel="noopener noreferrer">FullStack Labs - 2024 Software Development Price Guide</a>
            <a href="https://www.payscale.com/research/US/Job=Software_Engineer_Contractor/Hourly_Rate" target="_blank" rel="noopener noreferrer">PayScale - Software Engineer Contractor Hourly Pay</a>
          </div>

          <h3>API Key Security & Liability</h3>
          <div className="source-list">
            <a href="https://nordicapis.com/keep-api-keys-safe-because-the-repercussions-are-huge/" target="_blank" rel="noopener noreferrer">Nordic APIs - Keep API Keys Safe</a>
            <a href="https://www.wallarm.com/what/api-tokens-leaks" target="_blank" rel="noopener noreferrer">Wallarm - API Token Leaks Guide</a>
            <a href="https://www.gitguardian.com/remediation/google-api-key" target="_blank" rel="noopener noreferrer">GitGuardian - Remediating Google API Key Leaks</a>
            <a href="https://travisasm.com/blog/our-blog-1/api-key-leaks-how-to-detect-prevent-and-secure-your-business-57" target="_blank" rel="noopener noreferrer">Travis ASM - API Key Leaks</a>
          </div>

          <h3>Wage Deduction Laws</h3>
          <div className="source-list">
            <a href="https://laborcommission.utah.gov/" target="_blank" rel="noopener noreferrer">Utah Labor Commission - Wage Regulations</a>
            <a href="https://www.ecfr.gov/current/title-29/subtitle-A/part-4/subpart-D/subject-group-ECFR2c50d9c2d69b435/section-4.168" target="_blank" rel="noopener noreferrer">Federal Register 29 CFR 4.168</a>
            <a href="https://www.dol.gov/agencies/whd/fact-sheets/78d-h2b-deductions" target="_blank" rel="noopener noreferrer">DOL Fact Sheet 78D - Deductions</a>
            <a href="https://fmlaw.org/blog/can-my-employer-deduct-money-from-my-paycheck-without-my-permission/" target="_blank" rel="noopener noreferrer">FM Law - Can Employer Deduct From Paycheck</a>
            <a href="https://www.legalfix.com/articles/can-an-employer-withhold-pay" target="_blank" rel="noopener noreferrer">LegalFix - Can an Employer Withhold Pay?</a>
          </div>

          <h3>Professional Liability Insurance</h3>
          <div className="source-list">
            <a href="https://www.insureon.com/technology-business-insurance/software-developers" target="_blank" rel="noopener noreferrer">Insureon - Software Developer Insurance</a>
            <a href="https://www.thehartford.com/professional-liability-insurance/errors-omissions-insurance/technology" target="_blank" rel="noopener noreferrer">The Hartford - Technology E&O Insurance</a>
            <a href="https://www.techinsurance.com/technology-business-insurance/software-development" target="_blank" rel="noopener noreferrer">TechInsurance - Software Developer Insurance</a>
            <a href="https://www.flowspecialty.com/blog-post/what-is-tech-e-o" target="_blank" rel="noopener noreferrer">Flow Specialty - What is Tech E&O Insurance</a>
          </div>

          <h3>Agile Development & Pricing</h3>
          <div className="source-list">
            <a href="https://www.toptal.com/agile/software-costs-estimation-in-agile-project-management" target="_blank" rel="noopener noreferrer">Toptal - Software Costs Estimation in Agile</a>
            <a href="https://aida.mitre.org/agile/agile-cost-estimation/" target="_blank" rel="noopener noreferrer">MITRE - Agile Cost Estimation</a>
            <a href="https://www.scnsoft.com/software-development/about/how-we-work/pricing-models" target="_blank" rel="noopener noreferrer">SciSoft - Software Development Pricing Models</a>
            <a href="https://stayrelevant.globant.com/en/technology/agile-organizations/agile-fixed-price/" target="_blank" rel="noopener noreferrer">Globant - Agile and Fixed Price Projects</a>
          </div>

          <h3>Discovery Phase & Proof of Concept</h3>
          <div className="source-list">
            <a href="https://stfalcon.com/en/blog/post/discovery-phase" target="_blank" rel="noopener noreferrer">Stfalcon - Discovery Phase in Software Development</a>
            <a href="https://designli.co/blog/5-steps-proof-concept-successful-software-development/" target="_blank" rel="noopener noreferrer">Designli - Proof of Concept in Software Development</a>
            <a href="https://softjourn.com/insights/how-product-definition-helps-your-app-development-process" target="_blank" rel="noopener noreferrer">Softjourn - Project Discovery Phase Guide</a>
            <a href="https://fulcrum.rocks/blog/discovery-phase-software-development" target="_blank" rel="noopener noreferrer">Fulcrum - Discovery Phase Saves Time & Money</a>
          </div>

          <h3>AI Development Timelines</h3>
          <div className="source-list">
            <a href="https://www.thedroidsonroids.com/blog/ai-mobile-app-development-guide" target="_blank" rel="noopener noreferrer">Droids on Roids - AI Mobile App Development Guide 2025</a>
            <a href="https://jetruby.com/blog/ai-roadmap-for-ai-app-development-2025/" target="_blank" rel="noopener noreferrer">JetRuby - AI Roadmap for App Development 2025</a>
            <a href="https://www.code-brew.com/ai-app-development/" target="_blank" rel="noopener noreferrer">Code-Brew - AI App Development 2025</a>
            <a href="https://topflightapps.com/ideas/ai-app-development/" target="_blank" rel="noopener noreferrer">TopFlight Apps - AI App Development Guide</a>
            <a href="https://xbsoftware.com/blog/ai-in-software-development/" target="_blank" rel="noopener noreferrer">XB Software - Generative AI in Software Development</a>
          </div>
        </CollapsibleAppendix>
      </div>

      <div className="document-footer">
        <p><strong>Document Prepared By:</strong> Will Welsh</p>
        <p><strong>Company:</strong> Tech Integration Labs LLC</p>
        <p><strong>Date:</strong> December 2025</p>
      </div>

      {/* Video Section */}
      <div className="video-section" id="video-section">
        <h2>Video Message</h2>
        <video
          controls
          preload="metadata"
          playsInline
        >
          <source src="/secret/video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  )
}
