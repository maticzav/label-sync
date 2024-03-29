import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

import { Button } from '../components/Button'
import Hero from '../components/Hero'
import * as Feature from '../components/Feature'
import Footer from '../components/Footer'
import Navigation from '../components/Navigation'
import Section from '../components/Section'
import Tier from '../components/Tier'
import Testimonial from '../components/Testimonial'

import { NOTION_DOCS_URL, NOTION_SUPPORT_URL } from '../constants'

import { scrollToId } from '../lib/scroll'
import { Toggle } from 'components/Toggle'
import { useCallback } from 'react'
import { getPlanPrice, PLAN_IDS } from 'lib/checkout'

export default function Home({ prices }: { prices: { annual: number; monthly: number } }) {
  return (
    <>
      <Head>
        {/* Splitbee */}
        <script async src="https://cdn.splitbee.io/sb.js" />

        {/* Crisp */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `window.$crisp=[];window.CRISP_WEBSITE_ID="f485b5a2-8a24-43ec-8783-7542d6ef3c25";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`,
          }}
        />

        <title>GitHub LabelSync - The best way to sync labels</title>

        <meta
          name="description"
          content="LabelSync helps you effortlessly sync labels across your organization. It comes with utility tools that help with the transition and advanced features that help you manage your labels and issues better."
        />
      </Head>

      {/* Content */}
      <Navigation
        links={[
          {
            label: 'Documentation',
            href: NOTION_DOCS_URL,
          },
          {
            label: 'Install',
            href: 'https://github.com/apps/labelsync-manager',
          },
          {
            label: 'Pricing',
            href: '#',
            onClick: () => scrollToId('pricing'),
          },
          {
            label: 'Features',
            href: '#',
            onClick: () => scrollToId('features'),
          },
          {
            label: 'Support',
            href: NOTION_SUPPORT_URL,
          },
        ]}
      />

      <Hero />

      <Introduction />
      <Features />
      <DetailedFeatures />
      <Testimonials />
      <Pricing price={prices} />
      <FAQ />
      <Footer />
    </>
  )
}

/**
 * SSR function that fetches the latest prices from the server.
 */
export const getStaticProps = async () => {
  const [annual, monthly] = await Promise.all([
    //
    getPlanPrice('ANNUALLY'),
    getPlanPrice('MONTHLY'),
  ])

  return {
    props: {
      prices: {
        monthly: monthly.monthly_amount,
        annual: annual.monthly_amount,
      },
    },
  }
}

// Sections ------------------------------------------------------------------

function Introduction() {
  return (
    <div className="py-10 bg-gray-30 overflow-hidden md:py-14 lg:py-24">
      <Testimonial
        heading="Welcome to LabelSync!"
        name="Matic Zavadlal"
        role="Creator of LabelSync"
        image="/img/testimonial/matic.jpg"
        content={
          <p>
            &ldquo;While working at Prisma, I discovered that many companies struggle with repository organisation. In
            particular, companies struggle with managing labels across multiple repositories in their GitHub accounts.
            That's why I created LabelSync - to help you get to the best parts of labels more quickly. &rdquo;
          </p>
        }
      />
    </div>
  )
}

function Features() {
  return (
    <Section id="features" name="features" className="bg-white overflow-hidden">
      <div className="container">
        <div className="relative max-w-screen-xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Side Art */}
          <svg
            className="absolute top-0 left-full transform -translate-x-1/2 -translate-y-3/4 lg:left-auto lg:right-full lg:translate-x-2/3 lg:translate-y-1/4"
            width="404"
            height="784"
            fill="none"
            viewBox="0 0 404 784"
          >
            <defs>
              <pattern
                id="8b1b5f72-e944-4457-af67-0c6d15a99f38"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="4" height="4" className="text-gray-200" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="404" height="784" fill="url(#8b1b5f72-e944-4457-af67-0c6d15a99f38)" />
          </svg>

          {/* Features */}

          <div className="relative lg:grid lg:grid-cols-3 lg:gap-x-8">
            <div className="lg:col-span-1">
              <h3 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10">
                <span className="mr-3">🚀</span>
                <span className="underline-green">It's game changing.</span>
              </h3>
            </div>

            <div className="mt-10 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:col-span-2 lg:mt-0">
              <div>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white">
                  <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                </div>
                <div className="mt-5">
                  <h5 className="text-lg leading-6 font-medium text-gray-900">Centralised management</h5>
                  <p className="mt-2 text-base leading-6 text-gray-500">
                    Sync all your repositories from a central management repository using one of the configuration
                    languages.
                  </p>
                </div>
              </div>

              <div className="mt-10 sm:mt-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white">
                  <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                </div>
                <div className="mt-5">
                  <h5 className="text-lg leading-6 font-medium text-gray-900">Flexible configuration</h5>
                  <p className="mt-2 text-base leading-6 text-gray-500">
                    Restrict unconfigured labels, or create a set of common ones to share between repositories.
                  </p>
                </div>
              </div>

              <div className="mt-10 sm:mt-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white">
                  <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="mt-5">
                  <h5 className="text-lg leading-6 font-medium text-gray-900">Label Aliases</h5>
                  <p className="mt-2 text-base leading-6 text-gray-500">
                    Align label configurations quickly by
                    <a href="https://github.com/maticzav/label-sync#yaml" className="font-bold mx-1">
                      aliasing
                    </a>
                    a group of old labels to a new, single label.
                  </p>
                </div>
              </div>

              <div className="mt-10 sm:mt-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white">
                  <svg
                    fill="none"
                    className="h-6 w-6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <div className="mt-5">
                  <h5 className="text-lg leading-6 font-medium text-gray-900">Automate your workflow</h5>
                  <p className="mt-2 text-base leading-6 text-gray-500">
                    Create Label workflows using label
                    <a href="https://github.com/maticzav/label-sync#yaml" className="font-bold ml-1">
                      siblings
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

function DetailedFeatures() {
  return (
    <Section id="detailed-features" name="detailed fetaures" className="relative bg-gray-50 overflow-hidden">
      <div className="text-center">
        <h2 className="inline-block mt-20 text-4xl tracking-tight leading-10 font-extrabold text-gray-900 sm:leading-none sm:text-6xl lg:text-5xl xl:text-6xl underline-green">
          Features
        </h2>
      </div>

      <div className="relative container mx-auto pt-6 md:px-10 pb-20 md:pb-20 lg:pb-24 xl:pb-32">
        {/* Issues */}

        <Feature.Left
          caption="Automate in Github"
          title={['bring your', 'workflows to life']}
          icon={<span className="mr-2">🌈</span>}
          description={
            <>
              Keep your workflow in GitHub so everyone can see what the priorities are and how far down the chain bug
              has come.
            </>
          }
          alt="Issues Overview"
          image="/img/examples/issues.png"
        />

        {/* PR message */}

        <Feature.Right
          caption="Immediate feedback"
          title={['get feedback', 'instantly']}
          description={
            <>LabelSync manager comments on your pull request so you can predict what changes are going to happen.</>
          }
          alt="PullRequest message"
          image="/img/examples/pr-comment.png"
          icon={<span className="mr-2">🤖</span>}
        />

        {/* Yaml */}

        <Feature.Left
          caption="Language of flexibility"
          title={['use the power of', 'yaml for configuration.']}
          icon={
            <span className="inline-block mr-2">
              <svg className="w-10 h-10" viewBox="0 0 512 512">
                <path d="M235.793457,20.9389935l-91.8156738,137.6740112v87.2750244H87.7020035v-87.2751465L0,20.9389935h63.2502899l55.7678528,88.6458817l56.2244568-88.6458817H235.793457z M330.2944641,195.8635406H228.4328003l-20.7168121,50.0244904h-45.1060944l95.3815918-224.9490356h46.1360474l91.5108948,224.9490356h-48.1963501L330.2944641,195.8635406z M313.3734131,151.1300201l-31.2258606-82.5503616l-34.8368378,82.5503616H313.3734131z M87.7023544,270.5895996v220.471405h47.3023605V338.9823914l49.5055237,102.2188416h37.2337494l51.1964111-105.8118896v155.6254272h45.3786011V270.5895996h-61.959259l-54.977951,99.7063904l-52.3599548-99.7063904H87.7023544z M512,443.201355H395.6384277V270.5895996h-48.1963501v219.5221863L512,490.111969V443.201355z" />
              </svg>
            </span>
          }
          description={
            <>
              LabelSync uses YAML as a default configuration language. This allows you to use features such as anchors
              to organise your configuration more efficiently.
            </>
          }
          image="/img/examples/yaml.png"
          alt="YAML configuration"
        />

        {/* TypeScript */}

        <Feature.Right
          caption="Prefer TypeScript?"
          title={['Use TypeScript to', 'configure everything.']}
          icon={
            <span className="mr-3">
              <svg className="h-10 w-10 inline-block" viewBox="0 0 128 128">
                <path d="M1.5,63.91v62.5h125V1.41H1.5Zm100.73-5a15.56,15.56,0,0,1,7.82,4.5,20.58,20.58,0,0,1,3,4c0,.16-5.4,3.81-8.69,5.85-.12.08-.6-.44-1.13-1.23a7.09,7.09,0,0,0-5.87-3.53c-3.79-.26-6.23,1.73-6.21,5a4.58,4.58,0,0,0,.54,2.34c.83,1.73,2.38,2.76,7.24,4.86,8.95,3.85,12.78,6.39,15.16,10,2.66,4,3.25,10.46,1.45,15.24-2,5.2-6.9,8.73-13.83,9.9a38.32,38.32,0,0,1-9.52-.1,23,23,0,0,1-12.72-6.63c-1.15-1.27-3.39-4.58-3.25-4.82a9.34,9.34,0,0,1,1.15-.73L82,101l3.59-2.08.75,1.11a16.78,16.78,0,0,0,4.74,4.54c4,2.1,9.46,1.81,12.16-.62a5.43,5.43,0,0,0,.69-6.92c-1-1.39-3-2.56-8.59-5-6.45-2.78-9.23-4.5-11.77-7.24a16.48,16.48,0,0,1-3.43-6.25,25,25,0,0,1-.22-8c1.33-6.23,6-10.58,12.82-11.87A31.66,31.66,0,0,1,102.23,58.93ZM72.89,64.15l0,5.12H56.66V115.5H45.15V69.26H28.88v-5A49.19,49.19,0,0,1,29,59.09C29.08,59,39,59,51,59L72.83,59Z"></path>
              </svg>
            </span>
          }
          description={
            <>
              LabelSync ships with a TypeScript library that lets you use everything that TypeScript offers to automate
              you configuration.
            </>
          }
          image="/img/examples/typescript.png"
          alt="Issues overview"
        />

        {/* Siblings */}

        <Feature.Left
          caption="Efficient workflow"
          title={['connect labels with', "LabelSync's siblings."]}
          icon={<span className="inline-block mr-2">👨‍👩‍👦</span>}
          description={
            <>
              Each label in your configuration can reference
              <span className="underline-green ml-1">mutliple siblings</span>. Whenever you add a label to an issue or
              pull request, LabelSync will automatically add all the missing siblings as well.
            </>
          }
          image="/img/examples/siblings.png"
          alt="Siblings example"
        />

        {/*  */}

        <div className="text-center">
          <h2 className="inline-block mt-20 text-4xl tracking-tight leading-10 font-bold text-gray-900 sm:leading-none sm:text-4xl lg:text-3xl xl:text-4xl">
            and more...
          </h2>
        </div>
      </div>
    </Section>
  )
}

function Testimonials() {
  return (
    <Section
      id="prisma-testimonial"
      name="prisma testimonial"
      className="py-15 bg-gray-30 overflow-hidden md:py-20 lg:py-24"
    >
      <Testimonial
        heading="What our users say about us?"
        content={
          <p className="mb-3">
            &ldquo;Label-Sync enables us to have much a more efficient project management process where everything
            relies on a consistent set of labels. Triage, Prioritization, Estimation, everything can be done with labels
            now. &rdquo;
          </p>
        }
        role="Engineering Manager, Prisma"
        name="Jan Piotrowski"
        image="/img/testimonial/jan.png"
        logo={{
          image: '/img/logos/prisma.svg',
          name: 'Prisma',
          url: 'https://prisma.io',
        }}
        pattern
      />
    </Section>
  )
}

function Pricing({ price }: { price: { annual: number; monthly: number } }) {
  const [cadence, setPeriod] = useState<'ANNUALLY' | 'MONTHLY'>('ANNUALLY')
  const toggle = useCallback(() => {
    if (cadence === 'ANNUALLY') {
      setPeriod('MONTHLY')
    } else {
      setPeriod('ANNUALLY')
    }
  }, [cadence, setPeriod])

  return (
    <Section id="pricing" name="pricing" className="bg-emerald-600">
      <div className="pt-12 container text-center px-10 sm:px-6 sm:pt-16 lg:pt-24">
        <h2 className="text-lg leading-6 font-semibold text-gray-300 uppercase tracking-wider">Pricing</h2>
        <p className="mt-2 text-3xl leading-9 font-extrabold text-white sm:text-4xl sm:leading-10 lg:text-5xl lg:leading-none">
          Ready to get started?
        </p>
        <p className="mt-4 md:mt-6 text-xl mx-auto md:max-w-2xl leading-7 text-gray-200">
          Know what you are looking for? Go Pro! <br />
          Still undecided? Start with a free plan and see how it works!
        </p>
      </div>

      <div className="mt-8 lg:mt-12">
        <Toggle isOn={cadence === 'ANNUALLY'} onClick={toggle} options={{ off: 'Pay monthly', on: 'Pay annually' }} />
      </div>

      <div className="mt-8 pb-12 bg-white sm:mt-12 sm:pb-16 lg:mt-12 lg:pb-24 relative">
        <div className="absolute inset-0 h-3/4 lg:h-1/2 bg-emerald-600" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto lg:max-w-5xl lg:grid lg:grid-cols-2 lg:gap-5">
            {/* Free */}
            <div>
              <Tier
                name="Free"
                description="Great for starting out with LabelSync"
                price={<>$0</>}
                features={[
                  { name: 'LabelSync Manager' },
                  { name: 'Configuration Libraries' },
                  { name: 'Limited to 5 Repository Configurations' },
                  { name: 'No Credit Card Required' },
                ]}
                link={
                  <Link href={{ pathname: '/subscribe', query: { plan: 'FREE' } }}>
                    <a>
                      <Button>Install LabelSync</Button>
                    </a>
                  </Link>
                }
              ></Tier>
            </div>

            {/* Paid */}
            <div className="mt-10 lg:mt-0">
              <Tier
                name="The Complete solution"
                description="Best for teams"
                price={
                  <>
                    {cadence === 'ANNUALLY' && <>${price.annual.toFixed(2)}</>}
                    {cadence === 'MONTHLY' && <>${price.monthly.toFixed(2)}</>}
                    <span className="ml-1 text-2xl leading-8 font-medium text-gray-500">/mo</span>
                  </>
                }
                features={[
                  { name: 'Everything in Free Plan' },
                  { name: 'Siblings and Aliasing' },
                  { name: 'Unlimited Repositories' },
                  { name: 'Wildcard Repository Configuration' },
                ]}
                link={
                  <Link href={{ pathname: '/subscribe', query: { plan: 'PAID', period: cadence } }}>
                    <a>
                      <Button>Start Syncing</Button>
                    </a>
                  </Link>
                }
              ></Tier>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

function FAQ() {
  return (
    <div className="bg-white">
      <div className="container mx-auto pt-12 pb-16 sm:pt-16 sm:pb-20 px-4 sm:px-6 lg:pt-20 lg:pb-28 lg:px-8">
        <h2 className="text-3xl leading-9 font-extrabold text-gray-900">Frequently asked questions</h2>

        <div className="mt-6 border-t-2 border-gray-100 pt-10">
          <dl className="md:grid md:grid-cols-2 md:gap-8">
            {/* Left Questions */}
            <div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">
                  I have a problem but don't know who to ask.
                </dt>
                <dd className="mt-2">
                  <p className="text-base leading-6 text-gray-500">
                    Chat with us on Crisp or send an
                    <a className="mx-1 underline" href="mailto:support@label-sync.com">
                      email
                    </a>
                    to our support team. We'll try to get back to you as soon as possible.
                  </p>
                </dd>
              </div>
            </div>

            {/* Right Questions */}
            <div className="mt-12 md:mt-0">
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">
                  I have an idea/problem that LabelSync could solve.
                </dt>
                <dd className="mt-2">
                  <p className="text-base leading-6 text-gray-500">
                    Please reach out to
                    <a href="mailto:matic@label-sync.com" className="underline mx-1">
                      matic@label-sync.com
                    </a>
                    or start a Crisp chat. I'd be more than happy to chat about LabelSync with you!
                  </p>
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
