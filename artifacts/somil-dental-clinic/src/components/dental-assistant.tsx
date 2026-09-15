import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

type AssistantMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  showBooking?: boolean;
};

type AssistantSettings = { address: string; phone: string; email: string; hours: string; sundayHours: string };
type AssistantTreatment = { title: string; price: string };

const quickPrompts = [
  'What are your clinic hours?',
  'How much is a root canal?',
  'What treatments do you offer?',
  'I need an appointment',
];

function getAssistantReply(question: string, settings: AssistantSettings | null, treatments: AssistantTreatment[]): Omit<AssistantMessage, 'id'> {
  const input = question.toLowerCase().trim();
  const clinicAddress = settings?.address || 'the clinic address listed on the contact section';
  const clinicPhone = settings?.phone || 'the clinic phone number listed on the contact section';
  const clinicEmail = settings?.email || 'the clinic email listed on the contact section';
  const findTreatment = (pattern: RegExp) => treatments.find((treatment) => pattern.test(treatment.title.toLowerCase()));
  const rootCanal = findTreatment(/root canal|rct/);
  const cleaning = findTreatment(/clean|scaling/);
  const whitening = findTreatment(/whiten|bright/);
  const braces = findTreatment(/brace|orthodont/);
  const pediatric = findTreatment(/child|kid|pediatric/);

  if (/appointment|book|visit|schedule|consult/.test(input)) {
    return {
      role: 'assistant',
      text: 'I can help you start an appointment request. Choose a treatment and a preferred date and time, and the clinic team will confirm availability.',
      showBooking: true,
    };
  }

  if (/hour|open|close|time|when/.test(input)) {
    return {
      role: 'assistant',
      text: `The clinic hours are ${settings?.hours || 'available in the contact section'}. ${settings?.sundayHours || ''}`.trim(),
    };
  }

  if (/root canal|rct|endodont/.test(input)) {
    return {
      role: 'assistant',
      text: `${rootCanal?.title || 'Root Canal Treatment'} is listed at ${rootCanal?.price || 'a consultation-based price'}. Dr. Somil focuses on comfortable, patient-first endodontic care. Final treatment needs are confirmed during consultation.`,
      showBooking: true,
    };
  }

  if (/clean|scaling|polish/.test(input)) {
    return {
      role: 'assistant',
      text: `${cleaning?.title || 'Teeth Cleaning'} is listed at ${cleaning?.price || 'a consultation-based price'} and includes professional scaling and polishing to remove plaque.`,
      showBooking: true,
    };
  }

  if (/whiten|bright/.test(input)) {
    return {
      role: 'assistant',
      text: `${whitening?.title || 'Teeth Whitening'} is listed at ${whitening?.price || 'a consultation-based price'}. The clinic can guide you on the right approach after checking your teeth and gums.`,
      showBooking: true,
    };
  }

  if (/brace|orthodont/.test(input)) {
    return {
      role: 'assistant',
      text: `${braces?.title || 'Braces / Orthodontics'} is listed at ${braces?.price || 'a consultation-based price'}. Book a consultation so the team can discuss the right plan for your bite and smile.`,
      showBooking: true,
    };
  }

  if (/child|kid|pediatric/.test(input)) {
    return {
      role: 'assistant',
      text: `${pediatric?.title || 'Pediatric Dentistry'} is listed at ${pediatric?.price || 'a consultation-based price'}, with a gentle approach designed for children.`,
      showBooking: true,
    };
  }

  if (/price|cost|fee|how much|rate|₹|rupee/.test(input)) {
    return {
      role: 'assistant',
      text: treatments.length ? `Listed treatments include ${treatments.slice(0, 6).map((treatment) => `${treatment.title} ${treatment.price}`).join(', ')}. The clinic confirms the final plan after consultation.` : 'Treatment prices are available after the clinic catalog loads. The clinic confirms the final plan after consultation.',
      showBooking: true,
    };
  }

  if (/treatment|service|offer|do you do/.test(input)) {
    return {
      role: 'assistant',
      text: treatments.length ? `The clinic offers ${treatments.map((treatment) => treatment.title).join(', ')}.` : 'The clinic treatment catalog is available in the Treatments section.',
      showBooking: true,
    };
  }

  if (/address|where|location|located|map/.test(input)) {
    return {
      role: 'assistant',
      text: `Somil Dental Clinic is at ${clinicAddress}.`,
    };
  }

  if (/phone|call|email|contact|reach/.test(input)) {
    return {
      role: 'assistant',
      text: `You can call ${clinicPhone} or email ${clinicEmail}. The team can confirm availability and answer care questions.`,
    };
  }

  if (/pain|emergency|injur|swelling|bleed/.test(input)) {
    return {
      role: 'assistant',
      text: `For severe pain, swelling, bleeding, or a dental injury, please contact the clinic directly at ${clinicPhone}. If you have a serious medical emergency, contact local emergency services.`,
    };
  }

  return {
    role: 'assistant',
    text: 'I can help with treatments, listed prices, clinic hours, location, contact details, and appointment requests. Try one of the quick questions below, or call the clinic for personal medical advice.',
  };
}

export default function DentalAssistant({ onBookAppointment, settings, treatments }: { onBookAppointment: () => void; settings: AssistantSettings | null; treatments: AssistantTreatment[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Hi, I’m the SDC Care Assistant. I can help with treatments, prices, clinic hours, and appointment requests.',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextMessageId = useRef(2);
  const replyTimeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (replyTimeoutRef.current !== null) window.clearTimeout(replyTimeoutRef.current);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const askQuestion = (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isTyping) return;

    setInput('');
    const userMessageId = nextMessageId.current;
    nextMessageId.current += 1;
    setMessages((current) => [...current, { id: userMessageId, role: 'user', text: trimmedQuestion }]);
    setIsTyping(true);

    replyTimeoutRef.current = window.setTimeout(() => {
      const assistantMessageId = nextMessageId.current;
      nextMessageId.current += 1;
      setMessages((current) => [...current, { id: assistantMessageId, ...getAssistantReply(trimmedQuestion, settings, treatments) }]);
      setIsTyping(false);
    }, 420);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    askQuestion(input);
  };

  return (
    <div className={`dental-assistant ${isOpen ? 'is-open' : ''}`}>
      {isOpen && (
        <section className="dental-assistant-panel" aria-label="SDC Care Assistant">
          <div className="dental-assistant-header">
            <div className="dental-assistant-identity">
              <span className="dental-assistant-avatar"><Bot size={19} /></span>
              <div>
                <strong>SDC Care Assistant</strong>
                <span><i />Free instant answers</span>
              </div>
            </div>
            <button className="dental-assistant-close" onClick={() => setIsOpen(false)} aria-label="Close care assistant">
              <X size={18} />
            </button>
          </div>

          <div className="dental-assistant-messages" aria-live="polite">
            {messages.map((message) => (
              <div className={`dental-assistant-message ${message.role}`} key={message.id}>
                {message.role === 'assistant' && <span className="dental-assistant-message-icon"><Sparkles size={12} /></span>}
                <div>
                  <p>{message.text}</p>
                  {message.showBooking && (
                    <button className="dental-assistant-book" onClick={onBookAppointment}>
                      Book an appointment <Send size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="dental-assistant-message assistant">
                <span className="dental-assistant-message-icon"><Sparkles size={12} /></span>
                <div className="dental-assistant-typing" aria-label="Assistant is typing"><i /><i /><i /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="dental-assistant-prompts">
            {quickPrompts.map((prompt) => (
              <button key={prompt} onClick={() => askQuestion(prompt)} disabled={isTyping}>{prompt}</button>
            ))}
          </div>

          <form className="dental-assistant-form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your visit..."
              aria-label="Ask the care assistant"
              disabled={isTyping}
            />
            <button type="submit" aria-label="Send message" disabled={!input.trim() || isTyping}>
              <Send size={16} />
            </button>
          </form>
          <p className="dental-assistant-note">For diagnosis or urgent symptoms, please call the clinic.</p>
        </section>
      )}

      <button className="dental-assistant-launcher" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-label={isOpen ? 'Close SDC Care Assistant' : 'Open SDC Care Assistant'}>
        <span className="dental-assistant-launcher-icon">{isOpen ? <X size={21} /> : <MessageCircle size={21} />}</span>
        <span className="dental-assistant-launcher-copy"><strong>Ask SDC</strong><small>Care assistant</small></span>
      </button>
    </div>
  );
}