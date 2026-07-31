import { Link } from 'react-router-dom'
import { ArrowSquareOut, Pulse, ShieldCheck } from '@phosphor-icons/react'
import { BrandMark } from './ui.jsx'

const groups = [
  {
    title: 'Product',
    links: [
      ['Risk predictor', '/predict'],
      ['Operations dashboard', '/dashboard'],
      ['Live tracking', '/tracking'],
      ['Audit history', '/history'],
    ],
  },
  {
    title: 'Intelligence',
    links: [
      ['Delay signals', '/#platform'],
      ['Weather context', '/#platform'],
      ['Route monitoring', '/#workflow'],
      ['Decision support', '/#results'],
    ],
  },
  {
    title: 'Account',
    links: [
      ['Create account', '/register'],
      ['Log in', '/login'],
      ['Profile', '/profile'],
      ['Settings', '/settings'],
    ],
  },
]

function FooterLinks({ group }) {
  return (
    <>
      <h3>{group.title}</h3>
      <ul>
        {group.links.map(([label, to]) => (
          <li key={label}><Link to={to}>{label}</Link></li>
        ))}
      </ul>
    </>
  )
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link to="/" aria-label="TradeGuard AI home"><BrandMark /></Link>
          <p>See risk sooner. Move every shipment with confidence.</p>
          <div className="site-footer__trust"><ShieldCheck /> AI-assisted logistics decisions</div>
        </div>

        <div className="site-footer__groups">
          {groups.map((group) => (
            <section key={group.title} className="site-footer__group">
              <FooterLinks group={group} />
            </section>
          ))}
        </div>

        <div className="site-footer__mobile-groups">
          {groups.map((group) => (
            <details key={group.title}>
              <summary>{group.title}</summary>
              <FooterLinks group={group} />
            </details>
          ))}
        </div>

        <div className="site-footer__bottom">
          <p>© 2026 TradeGuard AI. Shipment intelligence for better decisions.</p>
          <div>
            <a href="/api/health" aria-label="Service health">Status <Pulse /></a>
            <a href="/api/docs" aria-label="API documentation">API docs <ArrowSquareOut /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
