import React from 'react';

export default function StarfieldHero({ title, children }: { title: JSX.Element, children?: React.ReactNode }) {
  const starsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const hasRenderedRef = React.useRef(false);

  React.useEffect(() => {

    if (!!starsContainerRef.current && !hasRenderedRef.current) {
      hasRenderedRef.current = true;
      const starsElem = starsContainerRef.current;

      (async () => {
        const { default: stars } = await import('./stars');
        stars(starsElem);
      })();

    }
  }, [starsContainerRef.current, hasRenderedRef.current]);

  return <div
  ref={starsContainerRef}
  id="stars"
  className="flex min-h-screen py-8 relative bg-gradient-6"
  >
  <div className="z-10 m-auto">
    { !!title && <div
      className="flex flex-col gap-4 justify-center items-center text-white"
    >
      <h1 className="pb-5 text-center font-display text-2xl md:text-4xl text-bold font-medium leading-[1.2]">{ title }</h1>
      <span className="divider block mx-auto bg-blueGreenLight mb-5" />
      { children }
    </div> }
  </div> 
  <button
    id="toggle-animation"
    className="absolute left-0 bottom-0 text-xs m-1.5 py-1.5 px-2 transition duration-300 ease-in-out"
  >
    Disable animation
  </button>
  <a
    href="#why"
    className="
      view-more
      block
      absolute
      bottom-8
      w-full
      md:hidden
      hover:opacity-75
    "
  >
  </a>
  </div>
}