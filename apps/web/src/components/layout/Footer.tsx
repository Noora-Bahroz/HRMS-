import { Github, Youtube, Linkedin, Instagram, Twitter, type LucideIcon } from "lucide-react";

interface SocialLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

const socials: SocialLink[] = [
  { label: "X", href: "https://twitter.com", icon: Twitter },
  { label: "LinkedIn", href: "https://www.linkedin.com", icon: Linkedin },
  { label: "Instagram", href: "https://www.instagram.com", icon: Instagram },
  { label: "GitHub", href: "https://github.com", icon: Github },
  { label: "YouTube", href: "https://www.youtube.com", icon: Youtube },
];

const footerLinks = ["Home", "Products", "Partners", "Certifications", "Contact", "Terms", "Social"];

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-10">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-600 text-sm font-bold text-white">
            H
          </div>
          <span className="text-base font-semibold text-gray-800 dark:text-neutral-100">HRMS</span>
        </div>

        {/* Social icons */}
        <div className="flex items-center justify-center gap-4">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-brand-400"
            >
              <s.icon size={16} />
            </a>
          ))}
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-500">
          {footerLinks.map((link) => (
            <a key={link} href="#" className="transition-colors hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100">
              {link}
            </a>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-neutral-500">
          © {new Date().getFullYear()} HRMS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
