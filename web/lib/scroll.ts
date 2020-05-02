export function scrollToId(id: string) {
  const duration = 1500
  const fps = 100
  const chunk = duration / fps

  let time = duration // current frame
  const targetElement = document.getElementById(id)

  /* Report unknown element. */
  if (!targetElement) {
    throw new Error('No element with id: ' + id)
  }

  const targetOffset = targetElement.offsetTop + 10

  var frame = setInterval(() => {
    /* Position change each milisecond. */
    var currentOffset = window.pageYOffset
    var diffOffset = targetOffset - currentOffset

    var intermediateOffset = currentOffset + (1 - time / duration) * diffOffset

    window.scrollTo(window.pageXOffset, intermediateOffset)

    /* Count time */
    time = time - chunk

    /* Interval reset once it's over of very close. */
    if (time < 100 || Math.abs(diffOffset) < 10) {
      clearInterval(frame)
    }
  }, chunk)
}
