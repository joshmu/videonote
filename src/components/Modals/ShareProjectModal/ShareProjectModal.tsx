/**
 * @path /src/components/Modals/ShareProjectModal/ShareProjectModal.tsx
 *
 * @project videonote
 * @file ShareProjectModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 2nd November 2020
 * @modified Sunday, 22nd November 2020 6:02:18 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from "motion/react";
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from "react";

import { ModalPrimaryBtn } from "@/components/shared/Modal/ModalBtn";
import { ToggleInput } from "@/components/shared/Toggle/Toggle";
import { useProjectsContext } from "@/context/projectsContext";
import { useNotificationContext } from "@/context/notificationContext";
import { ModalContainer } from "@/shared/Modal/ModalContainer";
import { ModalForm } from "@/shared/Modal/ModalForm";
import { ModalHeader } from "@/shared/Modal/ModalHeader";
import { ModalInnerContainer } from "@/shared/Modal/ModalInnerContainer";
import { ModalInput } from "@/shared/Modal/ModalInput";
import { ShareProjectInterface } from "@/shared/types";
import { copyToClipboard } from "@/utils/clientHelpers";

// todo: remove bad characters from url path entry
const formatUrl = (txt: string): string => txt.replace(" ", "-").toLowerCase();

type ShareForm = { url: string; canEdit: boolean; password: string; removePassword: boolean };

const toForm = (share: ShareProjectInterface): ShareForm => ({
  url: share.url,
  canEdit: share.canEdit,
  password: "",
  removePassword: false,
});

// An empty password field keeps the current password; only the remove control clears it.
const toShareData = ({ url, canEdit, password, removePassword }: ShareForm) => ({
  url,
  canEdit,
  ...(password ? { password } : removePassword && { password: "" }),
});

export const ShareProjectModal = ({
  toggle: toggleModal,
  motionKey,
}: {
  toggle: () => void;
  motionKey: string;
}) => {
  const { project, shareProject, removeShareProject } = useProjectsContext();
  const { addAlert } = useNotificationContext();
  const share = project.share as ShareProjectInterface | undefined;
  const initialState: ShareForm = share
    ? toForm(share)
    : { url: formatUrl(project.title), canEdit: true, password: "", removePassword: false };

  const [state, setState] = useState<ShareForm>(initialState);

  // update state if project.share state is updated (not on note changes)
  useEffect(() => {
    if (project.share) setState(toForm(project.share as ShareProjectInterface));
  }, [project._id, project.share]);

  const handleSubmit = async (event: FormEvent<HTMLButtonElement>): Promise<void> => {
    event.preventDefault();

    if (state.url.length === 0) {
      addAlert({
        type: "error",
        msg: "Unique Share Url required.",
      });
      return;
    }

    const apiSuccess = await shareProject(toShareData(state));
    if (apiSuccess) {
      addAlert({ type: "success", msg: "Shared project updated." });
      copyToClipboard(`https://videonote.app/vn/${state.url}`, addAlert);
    } else {
      addAlert({ type: "error", msg: "An error occurred..." });
    }
  };
  const handleRemoveShare = async (event: MouseEvent<HTMLElement>): Promise<void> => {
    event.preventDefault();
    const apiSuccess = await removeShareProject();

    if (apiSuccess) {
      addAlert({ type: "success", msg: "Project is now private." });
      toggleModal();
    } else {
      addAlert({ type: "error", msg: "An error occurred..." });
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { id, value } = event.target;
    setState((current) =>
      id === "url"
        ? { ...current, url: formatUrl(value) }
        : // A typed password replaces the current one instead of removing it.
          { ...current, password: value, removePassword: false },
    );
  };

  const handleCanEditToggle = (): void => {
    setState((current) => ({ ...current, canEdit: !current.canEdit }));
  };

  const handleRemovePasswordToggle = (): void => {
    setState((current) => ({ ...current, password: "", removePassword: !current.removePassword }));
  };

  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>Share Project - {project.title}</ModalHeader>

      <ModalInnerContainer>
        <ModalForm>
          <ModalInput
            title={`Unique share url title`}
            placeholder="Your-unique-link"
            id="url"
            type="text"
            value={state.url}
            onChange={handleChange}
          />
          <ModalInput
            title="Password protect?"
            placeholder={
              share?.hasPassword ? "Empty to keep the current password" : "Empty for no password"
            }
            id="password"
            type="password"
            value={state.password}
            onChange={handleChange}
          />

          {share?.hasPassword && (
            <div className="relative mt-2">
              <ToggleInput
                title="Remove the password"
                state={state.removePassword}
                onClick={handleRemovePasswordToggle}
              />
            </div>
          )}

          <div className="relative mt-2">
            <ToggleInput
              title={`Users can edit notes${state.canEdit ? "." : "?"}`}
              state={state.canEdit}
              onClick={handleCanEditToggle}
            />
          </div>

          {project.share && (
            <>
              <div>
                <p>Your project share link is:</p>
                <motion.a
                  href={`https://videonote.app/vn/${(project.share as ShareProjectInterface).url}`}
                  target="_blank"
                  whileHover={{ scale: 0.95 }}
                  onClick={() =>
                    copyToClipboard(
                      `https://videonote.app/vn/${(project.share as ShareProjectInterface).url}`,
                      addAlert,
                    )
                  }
                  className="italic cursor-pointer top-8 text-themeAccent"
                >
                  videonote.app/vn/
                  {(project.share as ShareProjectInterface).url}
                </motion.a>
              </div>
            </>
          )}

          {project.share && (
            <div className="flex items-center">
              <ModalPrimaryBtn handleClick={handleRemoveShare} type="button" color="bg-red-400">
                <span className="italic">Remove Share Access</span>
              </ModalPrimaryBtn>
            </div>
          )}

          <ModalPrimaryBtn handleClick={handleSubmit}>
            {project.share ? "Update" : "Share"}
          </ModalPrimaryBtn>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  );
};
