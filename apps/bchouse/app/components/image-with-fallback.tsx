import { useRef, useState } from "react";
import { classNames } from "../utils/classNames";

export type ImageWithFallbackProps = React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> & {
  fallback: React.ReactElement | (() => React.ReactElement)
}

export const ImageWithFallback:React.FC<ImageWithFallbackProps> = ({ fallback, ...props }) => {
  const [hasError, setError] = useState<boolean>(false);
  const [show, setShow] = useState<boolean>(false);

  if (hasError) {
    // errorRef.current.key = props.src + "__fallback";
    return typeof fallback === 'function' ? fallback() : fallback;
  }

  return <img {...props}  className={classNames(props.className, !show ? "invisible" : "visible")} key={props.src} onError={() => setError(true)} onLoad={() => setShow(true)}/>
}