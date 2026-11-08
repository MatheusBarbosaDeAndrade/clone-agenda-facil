import session from "models/session.js";
import user from "models/user.js";

export function homePathFor(papel) {
  return papel === "prestador" ? "/prestador/inicio" : "/cliente/inicio";
}

/** Aceita apenas caminhos internos (evita open redirect como //evil.com ou /\evil.com). */
function safeNext(value) {
  if (typeof value !== "string" || value.length > 300) return null;
  if (!/^\/(?![\/\\])[\w\-./?=&%#]*$/.test(value)) return null;
  return value;
}

/**
 * Protege páginas (getServerSideProps). O loader recebe (ctx, user) e pode
 * retornar { props }, { redirect } ou { notFound }.
 */
export function withPageAuth(papel, loader) {
  return async (ctx) => {
    ctx.res.setHeader("Cache-Control", "private, no-store");
    const current = await session.findValid(ctx.req);
    const found = current ? await user.findById(current.usuarioId) : null;
    if (!found) {
      if (current) session.clearCookie(ctx.res);
      return {
        redirect: {
          destination: `/login?next=${encodeURIComponent(ctx.resolvedUrl)}`,
          permanent: false,
        },
      };
    }
    if (papel && found.papel !== papel) {
      return {
        redirect: { destination: homePathFor(found.papel), permanent: false },
      };
    }
    user.touchLastAccess(found.id).catch(() => {});
    const result = loader ? await loader(ctx, found) : {};
    if (result?.redirect || result?.notFound) return result;
    return { props: { user: found, ...(result?.props || {}) } };
  };
}

/** Para login/cadastro: se já autenticado, vai direto para o painel. */
export function redirectIfAuthenticated(loader) {
  return async (ctx) => {
    const current = await session.findValid(ctx.req);
    if (current) {
      const found = await user.findById(current.usuarioId);
      if (found) {
        return {
          redirect: {
            destination: safeNext(ctx.query.next) || homePathFor(found.papel),
            permanent: false,
          },
        };
      }
    }
    const result = loader ? await loader(ctx) : {};
    return { props: { ...(result?.props || {}) } };
  };
}

export { safeNext };
