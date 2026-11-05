import { Problem } from './Problem'
import { Marketer } from './Marketer'
import { Context } from './Context'
import { Results } from './Results'
import { Reinforced } from './Reinforced'
import { Command } from './Command'
import { Research } from './Research'
import { Compare } from './Compare'
import { Pricing } from './Pricing'
import { Faq } from './Faq'
import { FinalCta } from './FinalCta'

/** Everything below the engine strip. Loaded as its own chunk after the hero has painted. */
export default function Sections() {
  return (
    <>
      <Problem />
      <Marketer />
      <Context />
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
