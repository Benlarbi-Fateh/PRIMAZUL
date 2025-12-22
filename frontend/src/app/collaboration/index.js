import { useEffect } from "react";
import { useRouter } from "next/router";

export default function CollaborationIndex() {
  const router = useRouter();

  useEffect(() => {
    // redirige vers une conversation par défaut
    router.replace("/collaboration/691f590c4aef019bef4f10a1"); // remplace "123" par un id valide
  }, [router]);

  return <div>Redirection vers votre espace de collaboration...</div>;
}
