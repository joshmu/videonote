/**
 * @path /pages/vn/[id].tsx
 *
 * @project videonote
 * @file [id].tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 8th October 2020
 * @modified Monday, 23rd November 2020 11:39:41 am
 * @copyright © 2020 - 2020 MU
 */

import { NextPage } from "next";
import absoluteUrl from "next-absolute-url";

import { Layout } from "@/components/Layout/Layout";
import { Modals } from "@/components/Modals/Modals";
import { Notification } from "@/components/Notification/Notification";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import { AppProviders } from "@/context/appProviders";
import { ControlsProvider } from "@/context/controlsContext";
import { NoteProvider } from "@/context/noteContext";
import { VideoProvider } from "@/context/videoContext";
import { AppContainer } from "@/layout/AppContainer/AppContainer";
import { Overlay } from "@/shared/Modal/Overlay";
import { createApiClient, requestSession } from "@/utils/apiClient";
import { redirectFromInitialProps } from "@/utils/clientHelpers";

interface Props {
  serverData?: {};
}

const ShareProjectPage: NextPage<Props> = ({ serverData = {} }) => {
  return (
    <AppProviders serverData={serverData}>
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
    </AppProviders>
  );
};

ShareProjectPage.getInitialProps = async (ctx) => {
  const shareUrl = String(ctx.query.id);

  // the public route needs no session token, so none is sent or stored
  const { origin } = absoluteUrl(ctx.req);
  const api = createApiClient({
    fetch: (input, init) => fetch(input, init),
    session: requestSession(undefined),
    origin,
  });
  const share = await api.openShare(shareUrl);

  // a password-protected Share stays here so the page can prompt for it
  if (share.kind === "notFound" || share.kind === "error") {
    return redirectFromInitialProps(ctx, "/hello");
  }

  return { serverData: { share } };
};

export default ShareProjectPage;
