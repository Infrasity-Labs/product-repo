import { Problem } from './Problem'
import { Marketer } from './Marketer'
import { Context } from './Context'
import { Steps } from './Steps'
import { Results } from './Results'
import { Reinforced } from './Reinforced'
import { Command } from './Command'
import { Research } from './Research'
import { Compare } from './Compare'
import { Pricing } from './Pricing'
import { Faq } from './Faq'
import { FinalCta } from './FinalCta'

/** Everything below the hero. */
export default function Sections() {
  return (
    <>
      <Problem />
      <Marketer />
      <Context />
      <Steps />
      <Results />
      <Reinforced />
      <Command />
      <Research />
      <Compare />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  )
}
