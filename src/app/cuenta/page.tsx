import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getMyCourses, getPublishedCourses } from "@/server/courses";
import { CuentaClient } from "@/components/cuenta-client";

export default async function CuentaPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <CuentaClient
        loggedIn={false}
        nombre=""
        email=""
        identificationType={null}
        identificationNumber={null}
        misCursos={[]}
        disponibles={[]}
      />
    );
  }

  const [misCursos, publicados] = await Promise.all([
    getMyCourses(session.user.id),
    getPublishedCourses(),
  ]);
  const misSlugs = new Set(misCursos.map((c) => c.slug));
  const disponibles = publicados.filter((c) => !misSlugs.has(c.slug));
  const userExtra = session.user as unknown as {
    identificationType: string | null;
    identificationNumber: string | null;
  };

  return (
    <CuentaClient
      loggedIn
      nombre={session.user.name}
      email={session.user.email}
      identificationType={userExtra.identificationType}
      identificationNumber={userExtra.identificationNumber}
      misCursos={misCursos}
      disponibles={disponibles}
    />
  );
}
