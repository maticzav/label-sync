import React, { useState } from 'react'
import Typist from 'react-typist'
import { shuffle } from 'lodash'

import { scrollToId } from '../lib/scroll'

export default function Hero() {
  const [typingIndex, setTyping] = useState(0)

  function nextTyping() {
    const nextIndex = typingIndex + 1
    if (nextIndex === typings.length) setTyping(0)
    else setTyping(nextIndex)
  }

  return (
    <div className="mt-10 mx-auto max-w-screen-xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 xl:mt-28">
      <div className="text-center">
        {/* Hero */}
        <div className="h-32">
          <h2 className="text-4xl tracking-tight leading-10 font-extrabold text-gray-900 sm:text-5xl sm:leading-none md:text-6xl">
            {/* Typing animation */}
            <Typing
              index={typingIndex}
              onTypingDone={nextTyping}
              key={typingIndex}
            ></Typing>
            {/* End of typing animation */}
          </h2>
        </div>

        {/* Explanation */}
        <p className="mt-5 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-10 md:text-xl md:max-w-3xl">
          Managing Github labels across multiple repositories is hard.
          <br className="hidden md:inline-block" />
          LabelSync makes it <span className="underline-green">easy</span>.
        </p>

        {/* Call to action */}
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            <a
              href="#"
              onClick={() => scrollToId('pricing')}
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:shadow-outline-teal transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10"
            >
              Sync labels
            </a>
          </div>
          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
            <a
              href="https://calendly.com/maticzav/labelsync"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded-md text-green-600 bg-white hover:text-green-500 focus:outline-none focus:shadow-outline-blue transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10"
            >
              Live demo
            </a>
          </div>
        </div>
        {/* End of call to action */}

        <div className="mt-10 md:mt-15 w-full flex justify-center">
          <a
            href="https://www.producthunt.com/posts/github-labelsync?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-github-labelsync"
            target="_blank"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=197223&theme=dark"
              className="block"
              alt="GitHub LabelSync - The best way to sync GitHub labels. | Product Hunt Embed"
              width="200px"
              height="43px"
            />
          </a>
        </div>
      </div>
    </div>
  )
}

const typings = shuffle([
  {
    lead: 'Sync labels.',
    sub: 'across all\n repositories.',
    color: 'text-green-400 whitespace-pre md:whitespace-normal',
  },
  {
    lead: 'Your Tasks and Code.',
    sub: 'All in GitHub.',
    color: 'text-gray-400',
  },
  {
    lead: 'Trello in GitHub.',
    sub: 'For Free.',
    color: 'text-blue-400',
  },
])

function Typing(props: { index: number; onTypingDone: () => void }) {
  const typing = typings[props.index]
  return (
    <>
      {typing.lead}
      <br className="" />
      <Typist
        key={`typist-${props.index}`}
        onTypingDone={props.onTypingDone}
        className={typing.color}
        startDelay={600}
        stdTypingDelay={12}
        avgTypingDelay={60}
        cursor={{ show: true }}
      >
        <span>{typing.sub}</span>
        <Typist.Backspace
          key={`backspace-${props.index}`}
          delay={1200}
          count={typing.sub.length}
        ></Typist.Backspace>
      </Typist>
    </>
  )
}
