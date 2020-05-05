import React, { useState } from 'react'
import Link from 'next/link'

import Button from '../components/Button'
import Hero from '../components/Hero'
import * as Feature from '../components/Feature'
import Footer from '../components/Footer'
import Navigation from '../components/Navigation'
import Tier from '../components/Tier'
import Testimonial from '../components/Testimonial'

import { NOTION_DOCS_URL } from '../constants'

import * as gtag from '../lib/gtag'
import { scrollToId } from '../lib/scroll'

/* Pricing event */

export default class Home extends React.Component {
  scrolledToPricing: boolean

  constructor(props: {}) {
    super(props)
    this.scrolledToPricing = false

    this.checkPricing = this.checkPricing.bind(this)
  }

  componentDidMount() {
    window.onscroll = this.checkPricing
  }

  componentWillUnmount() {
    window.onscroll = null
  }

  /**
   * Checks whether user has scrolled past pricing section.
   */
  checkPricing() {
    const pricingSection = document.getElementById('pricing')!

    /* reached pricing section */
    if (Math.abs(window.pageYOffset - pricingSection.offsetTop) < 150) {
      if (!this.scrolledToPricing) {
        // trigger event
        gtag.event({
          action: 'reached pricing',
          category: 'website',
          label: 'web',
          value: 1,
        })
      }
      this.scrolledToPricing = true
    }
  }

  render() {
    return (
      <>
        <title>Github LabelSync - The best way to sync labels</title>

        <Title></Title>
        <Introduction></Introduction>
        <Features></Features>
        <DetailedFeatures></DetailedFeatures>
        <Testimonials></Testimonials>
        <Pricing></Pricing>
        <FAQ></FAQ>
        <Footer></Footer>
      </>
    )
  }
}

/* Sections */

function Title() {
  return (
    <div className="relative bg-gray-80 overflow-hidden">
      <div className="relative pt-6 pb-12 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
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
              href: 'mailto:support@labelsync.com',
            },
          ]}
        ></Navigation>

        {/* Hero */}
        <Hero></Hero>
      </div>
    </div>
  )
}

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
            ”While working at Prisma, I discovered that many companies struggle
            with repository organisation. In particular, companies struggle with
            managing labels across multiple repositories in their organisation.
            That's why I created LabelSync - to help you get the best parts of
            labels more quickly.”
          </p>
        }
      ></Testimonial>
    </div>
  )
}

function Features() {
  return (
    <div className="bg-white overflow-hidden">
      <div className="container">
        <div className="relative max-w-screen-xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* <!-- Side art --> */}

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
                <rect
                  x="0"
                  y="0"
                  width="4"
                  height="4"
                  className="text-gray-200"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect
              width="404"
              height="784"
              fill="url(#8b1b5f72-e944-4457-af67-0c6d15a99f38)"
            />
          </svg>

          {/* <!-- Features --> */}

          <div className="relative lg:grid lg:grid-cols-3 lg:col-gap-8">
            <div className="lg:col-span-1">
              <h3 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10">
                <span className="mr-3">🚀</span>
                <span className="underline-green">It's game changing.</span>
              </h3>
            </div>

            <div className="mt-10 sm:grid sm:grid-cols-2 sm:col-gap-8 sm:row-gap-10 lg:col-span-2 lg:mt-0">
              {/* <!-- Features --> */}
              <div>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <svg
                    className="h-6 w-6"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                </div>
                <div className="mt-5">
                  <h5 className="text-lg leading-6 font-medium text-gray-900">
                    Centralised management
                  </h5>
                  <p className="mt-2 text-base leading-6 text-gray-500">
                    Sync all your repositories from a central management
                    repository using one of the configuration languages.
                  </p>
                </div>
              </div>
              <div className="mt-10 sm:mt-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <svg
                    className="h-6 w-6"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                </div>
                <div className="mt-5">
                  <h5 className="text-lg leading-6 font-medium text-gray-900">
                    Flexible configuration
                  </h5>
                  <p className="mt-2 text-base leading-6 text-gray-500">
                    Restrict unconfigured labels or set the default bulk to be
                    shared between repositories.
                  </p>
                </div>
              </div>

              <div className="mt-10 sm:mt-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <svg
                    className="h-6 w-6"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="mt-5">
                  <h5 className="text-lg leading-6 font-medium text-gray-900">
                    Label Aliases
                  </h5>
                  <p className="mt-2 text-base leading-6 text-gray-500">
                    Align label configurations quickly by
                    <a
                      href="https://github.com/maticzav/label-sync#yaml"
                      className="font-bold mx-1"
                    >
                      aliasing
                    </a>
                    a group of old labels in a new single label.
                  </p>
                </div>
              </div>
              <div className="mt-10 sm:mt-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
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
                  <h5 className="text-lg leading-6 font-medium text-gray-900">
                    Automate your workflow
                  </h5>
                  <p className="mt-2 text-base leading-6 text-gray-500">
                    Create Label workflows using label
                    <a
                      href="https://github.com/maticzav/label-sync#yaml"
                      className="font-bold ml-1"
                    >
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
    </div>
  )
}

function DetailedFeatures() {
  return (
    <div id="features" className="relative bg-gray-50 overflow-hidden">
      {/* <!-- Leading text --> */}

      <div className="text-center">
        <h2 className="inline-block mt-20 text-4xl tracking-tight leading-10 font-extrabold text-gray-900 sm:leading-none sm:text-6xl lg:text-5xl xl:text-6xl underline-green">
          Features
        </h2>
      </div>

      {/* <!-- Features --> */}

      <div className="relative container mx-auto pt-6 md:px-10 pb-20 md:pb-20 lg:pb-24 xl:pb-32">
        {/* <!-- GH Issues --> */}

        <Feature.Left
          caption="Automate in Github"
          title={['bring your', 'workflows to life']}
          icon={<span className="mr-2">🌈</span>}
          description={
            <>
              Keep your workflow in GitHub so everyone can see what the
              priorities are and how far down the chain bug has come.
            </>
          }
          alt="Issues Overview"
          image="/img/examples/issues.png"
        ></Feature.Left>

        {/* PR message */}

        <Feature.Right
          caption="Immediate feedback"
          title={['get feedback', 'instantly']}
          description={
            <>
              LabelSync manager comments on your pull request so you can predict
              what changes are going to happen
            </>
          }
          alt="PullRequest message"
          image="/img/examples/pr-comment.png"
          icon={<span className="mr-2">🤖</span>}
        ></Feature.Right>

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
              LabelSync uses YAML as a default configuration language. This
              allows you to use features such as anchors to organise your
              configuration more efficiently.
            </>
          }
          image="/img/examples/yaml.png"
          alt="YAML configuration"
        ></Feature.Left>

        {/* TypeScript */}

        <Feature.Right
          caption="Prefer TypeScript?"
          title={['Use TypeScript to', 'configure anything.']}
          icon={
            <span className="mr-3">
              <svg className="h-10 w-10 inline-block" viewBox="0 0 128 128">
                <path d="M1.5,63.91v62.5h125V1.41H1.5Zm100.73-5a15.56,15.56,0,0,1,7.82,4.5,20.58,20.58,0,0,1,3,4c0,.16-5.4,3.81-8.69,5.85-.12.08-.6-.44-1.13-1.23a7.09,7.09,0,0,0-5.87-3.53c-3.79-.26-6.23,1.73-6.21,5a4.58,4.58,0,0,0,.54,2.34c.83,1.73,2.38,2.76,7.24,4.86,8.95,3.85,12.78,6.39,15.16,10,2.66,4,3.25,10.46,1.45,15.24-2,5.2-6.9,8.73-13.83,9.9a38.32,38.32,0,0,1-9.52-.1,23,23,0,0,1-12.72-6.63c-1.15-1.27-3.39-4.58-3.25-4.82a9.34,9.34,0,0,1,1.15-.73L82,101l3.59-2.08.75,1.11a16.78,16.78,0,0,0,4.74,4.54c4,2.1,9.46,1.81,12.16-.62a5.43,5.43,0,0,0,.69-6.92c-1-1.39-3-2.56-8.59-5-6.45-2.78-9.23-4.5-11.77-7.24a16.48,16.48,0,0,1-3.43-6.25,25,25,0,0,1-.22-8c1.33-6.23,6-10.58,12.82-11.87A31.66,31.66,0,0,1,102.23,58.93ZM72.89,64.15l0,5.12H56.66V115.5H45.15V69.26H28.88v-5A49.19,49.19,0,0,1,29,59.09C29.08,59,39,59,51,59L72.83,59Z"></path>
              </svg>
            </span>
          }
          description={
            <>
              LabelSync ships with a TypeScript library that lets you use
              everything that TypeScript offers to automate you configuration.
            </>
          }
          image="/img/examples/typescript.png"
          alt="Issues overview"
        ></Feature.Right>

        {/* Siblings */}

        <Feature.Left
          caption="Efficient workflow"
          title={['connect labels with', "LabelSync's siblings."]}
          icon={<span className="inline-block mr-2">👨‍👩‍👦</span>}
          description={
            <>
              Each label in your configuration can reference
              <span className="underline-green ml-1">mutliple siblings</span>.
              Whenever you add a label to an issue or pull request, LabelSync
              will automatically add all the missing siblings as well.
            </>
          }
          image="/img/examples/siblings.png"
          alt="Siblings example"
        ></Feature.Left>

        {/*  */}

        <div className="text-center">
          <h2 className="inline-block mt-20 text-4xl tracking-tight leading-10 font-bold text-gray-900 sm:leading-none sm:text-4xl lg:text-3xl xl:text-4xl">
            and more...
          </h2>
        </div>

        {/* <!--  --> */}
      </div>
    </div>
  )
}

function Testimonials() {
  return (
    <div className="py-15 bg-gray-30 overflow-hidden md:py-20 lg:py-24">
      <Testimonial
        heading="What our users say about us?"
        content={
          <>
            <p className="mb-3">
              &ldquo;Label-Sync enables us to have much a more efficient project
              management process where everything relies on a consistent set of
              labels. Triage, Prioritization, Estimation, everything can be done
              with labels now.
            </p>
            <p>
              Furthermore, we use TypeScript in the configuration, which makes
              it super easy to track and test changes. At the same time we have
              the flexibility to keep managing additional labels manually, which
              gives us all the flexibility and special cases we need. &rdquo;
            </p>
          </>
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
      ></Testimonial>
    </div>
  )
}

function Pricing() {
  const [period, setPeriod] = useState<'yearly' | 'monthly'>('yearly')

  function toggle() {
    switch (period) {
      case 'monthly': {
        setPeriod('yearly')
        break
      }
      case 'yearly': {
        setPeriod('monthly')
        break
      }
    }
  }

  return (
    <div id="pricing" className="bg-green-500">
      <div className="pt-12 container text-center px-10 sm:px-6 sm:pt-16 lg:pt-24">
        <h2 className="text-lg leading-6 font-semibold text-gray-300 uppercase tracking-wider">
          Pricing
        </h2>
        <p className="mt-2 text-3xl leading-9 font-extrabold text-white sm:text-4xl sm:leading-10 lg:text-5xl lg:leading-none">
          Ready to get started?
        </p>
        {/* <p className="mt-4 md:mt-6 text-xl mx-auto md:max-w-2xl leading-7 text-gray-200">
          We are also giving you an option for 14-day free trial to find out how
          the tool works and a free tier to see how great it is.
        </p> */}
      </div>

      {/* Launch discount */}
      {/* <div className="mt-8 text-center sm:mt-8 lg:mt-12">
        <p className="text-2xl leading-9 font-bold text-white sm:text-3xl sm:leading-none italic">
          20% Launch Dicount
        </p>
      </div> */}

      {/* Period changer */}

      <div className="block mx-auto flex justify-center mt-8 lg:mt-12">
        <span className="mr-3 text-gray-200 font-semibold align-baseline">
          Pay monthly
        </span>

        {/*
          Simple toggle

          On: "bg-green-500", Off: "bg-gray-200"
        */}
        <span
          onClick={toggle}
          className={
            'relative inline-block flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline ' +
            (period === 'yearly' ? 'bg-green-400' : 'bg-gray-200')
          }
        >
          {/* On: "translate-x-5", Off: "translate-x-0" */}
          <span
            className={
              'inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200 ' +
              (period === 'yearly' ? 'translate-x-5' : 'translate-x-0')
            }
          ></span>
        </span>

        <span className="align-baseline font-semibold ml-3 text-gray-200">
          Pay annualy
        </span>
      </div>

      {/* <!-- Tiers --> */}

      <div className="mt-8 pb-12 bg-white sm:mt-12 sm:pb-16 lg:mt-12 lg:pb-24">
        {/* Container */}
        <div className="relative">
          {/* Background  */}
          <div className="absolute inset-0 h-3/4 lg:h-1/2 bg-green-500"></div>

          {/* Tiers container */}
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto lg:max-w-5xl lg:grid lg:grid-cols-2 lg:gap-5">
              {/* <!-- Free tier --> */}

              <div>
                <Tier
                  name="Free"
                  description="Great for starting out with LabelSync."
                  price={<>$0</>}
                  features={[
                    { name: 'LabelSync Manager' },
                    { name: 'Configuration Libraries' },
                    { name: 'Limited to 5 repositories' },
                  ]}
                  link={
                    <Link
                      href={{
                        pathname: '/subscribe',
                        query: { plan: 'FREE', period: 'MONTHLY' },
                      }}
                    >
                      <a>
                        <Button>Install LabelSync</Button>
                      </a>
                    </Link>
                  }
                ></Tier>
              </div>

              {/* <!-- Paid Tier --> */}
              <div className="mt-10 lg:mt-0">
                <Tier
                  name="The Complete solution"
                  description="Best for teams and users with rapid workflows."
                  price={
                    <>
                      {/* Yearly pricing */}
                      {period === 'yearly' && (
                        <>
                          $16
                          {/* $12
                          <span className="ml-1 text-2xl leading-8 font-medium text-gray-500 line-through">
                            $16
                          </span> */}
                        </>
                      )}
                      {/* Monthly pricing */}
                      {period === 'monthly' && (
                        <>
                          $20
                          {/* $16
                          <span className="ml-1 text-2xl leading-8 font-medium text-gray-500 line-through">
                            $20
                          </span> */}
                        </>
                      )}
                      <span className="ml-1 text-2xl leading-8 font-medium text-gray-500">
                        /mo
                      </span>
                    </>
                  }
                  features={[
                    { name: 'LabelSync Manager' },
                    { name: 'Configuration Libraries' },
                    { name: 'Siblings and Aliasing' },
                    { name: 'Unlimited repositories' },
                    { name: 'Wildcard repository configuration' },
                  ]}
                  link={
                    <Link
                      href={{
                        pathname: '/subscribe',
                        query: { plan: 'PAID', period: 'ANNUALLY' },
                      }}
                    >
                      <a>
                        <Button>Sync my labels</Button>
                      </a>
                    </Link>
                  }
                ></Tier>
              </div>
              {/* End of tiers */}
            </div>
          </div>
          {/* <!-- End of tiers container  --> */}
        </div>
      </div>
      {/* End of tier container */}
    </div>
  )
}

function FAQ() {
  return (
    <div className="bg-white">
      <div className="container mx-auto pt-12 pb-16 sm:pt-16 sm:pb-20 px-4 sm:px-6 lg:pt-20 lg:pb-28 lg:px-8">
        <h2 className="text-3xl leading-9 font-extrabold text-gray-900">
          Frequently asked questions
        </h2>
        <div className="mt-6 border-t-2 border-gray-100 pt-10">
          <dl className="md:grid md:grid-cols-2 md:gap-8">
            {/* <!-- LEFT Questions --> */}
            <div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">
                  I have a problem but don't know who to ask.
                </dt>
                <dd className="mt-2">
                  <p className="text-base leading-6 text-gray-500">
                    Please send us an
                    <a className="mx-1" href="mailto:support@label-sync.com">
                      email
                    </a>
                    to our support team. We'll try to get back to you as soon as
                    possible.
                  </p>
                </dd>
              </div>
            </div>

            {/* <!-- RIGHT questions --> */}
            <div className="mt-12 md:mt-0">
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">
                  I have an idea/problem that LabelSync could solve.
                </dt>
                <dd className="mt-2">
                  <p className="text-base leading-6 text-gray-500">
                    Please reach out to
                    <a href="mailto:matic@label-sync.com" className=" ml-1">
                      matic@label-sync.com
                    </a>
                    . I'd be more than happy to chat about LabelSync with you!
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
