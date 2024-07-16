export default function constrain(index: number, max: number) {
  return (index + max) % max;
}
