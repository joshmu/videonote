/**
 * @path /pages/index.tsx
 *
 * @project videonote
 * @file index.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Friday, 11th December 2020 9:55:34 am
 * @copyright © 2020 - 2020 MU
 */

import { StatusCodes } from "http-status-codes";
import { NextPage, NextPageContext } from "next";
import absoluteUrl from "next-absolute-url";

import { Layout } from "@/components/Layout/Layout";
import { Modals } from "@/components/Modals/Modals";
import { Notification } from "@/components/Notification/Notification";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import { ControlsProvider } from "@/context/controlsContext";
import { GlobalProvider } from "@/context/globalContext";
import { NoteProvider } from "@/context/noteContext";
import { VideoProvider } from "@/context/videoContext";
import { AppContainer } from "@/layout/AppContainer/AppContainer";
import { Overlay } from "@/shared/Modal/Overlay";
import { browserSession, createApiClient, requestSession } from "@/utils/apiClient";

interface Props {
  serverData?: {};
}

const IndexPage: NextPage<Props> = ({ serverData = {} }) => {
  return (
    <GlobalProvider serverData={serverData}>
      <VideoProvider>
        <NoteProvider>
          <ControlsProvider>
            <Layout>
              <AppContainer>
                <VideoPlayer />
                <Sidebar />
              </AppContainer>

              <Overlay />
              <Modals />
              <Notification />
            </Layout>
          </ControlsProvider>
        </NoteProvider>
      </VideoProvider>
    </GlobalProvider>
  );
};

IndexPage.getInitialProps = async (ctx: NextPageContext) => {
  // On the server the token comes from the request and no cookie is set;
  // a client-side navigation reads the browser cookie.
  const session = ctx.req ? requestSession(ctx.req.headers.cookie) : browserSession;

  if (!session.read()) {
    console.log("no token, redirecting...");
    // server
    ctx.res.writeHead(StatusCodes.MOVED_TEMPORARILY, {
      Location: `/hello`,
    });
    ctx.res.end();
    return;
  }

  // request data with JWT token
  const { origin } = absoluteUrl(ctx.req);
  const api = createApiClient({ fetch: (input, init) => fetch(input, init), session, origin });
  const result = await api.auth();

  // if token is invalid
  if (result.kind !== "ok") {
    ctx.res.writeHead(StatusCodes.MOVED_TEMPORARILY, {
      Location: `/login`,
    });
    ctx.res.end();
    return;
  }

  return { serverData: result.data };
};

export default IndexPage;
