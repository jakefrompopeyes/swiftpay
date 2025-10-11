export default function CheckoutRedirect() { return null }

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/',
      permanent: false
    }
  }
}
