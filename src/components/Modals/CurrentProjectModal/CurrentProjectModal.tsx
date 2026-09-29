/**
 * @path /src/components/Modals/CurrentProjectModal/CurrentProjectModal.tsx
 *
 * @project videonote
 * @file CurrentProjectModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Wednesday, 30th September 2020
 * @modified Wednesday, 25th November 2020 8:41:00 pm
 * @copyright © 2020 - 2020 MU
 */

import { ChangeEvent, useEffect, useState } from "react";

import { ModalPrimaryBtn } from "@/components/shared/Modal/ModalBtn";
import { useProjectsContext } from "@/context/projectsContext";
import { useNotificationContext } from "@/context/notificationContext";
import { LocalVideoForm } from "@/shared/LocalVideoForm/LocalVideoForm";
import { ModalContainer } from "@/shared/Modal/ModalContainer";
import { ModalForm } from "@/shared/Modal/ModalForm";
import { ModalHeader } from "@/shared/Modal/ModalHeader";
import { ModalInnerContainer } from "@/shared/Modal/ModalInnerContainer";
import { ModalInput } from "@/shared/Modal/ModalInput";
import { ProjectInterface } from "@/shared/types";

// import { ExportNotes } from './ExportNotes/ExportNotes'

export const CurrentProjectModal = ({
  toggle: toggleModal,
  motionKey,
}: {
  toggle: () => void;
  motionKey: string;
}) => {
  const { updateProject, project } = useProjectsContext();
  const { addAlert } = useNotificationContext();
  const [state, setState] = useState<ProjectInterface>(null);

  // reset the form for another project or a saved title/src, not for note changes
  useEffect(() => {
    setState(project);
  }, [project?._id, project?.title, project?.src]);

  const handleUpdate = (event: ChangeEvent<HTMLInputElement>): void => {
    event.preventDefault();

    if (state.title.length === 0) {
      addAlert({
        type: "error",
        msg: "Title required.",
      });
      return;
    }

    updateProject(state);
    addAlert({ type: "info", msg: `Updating project: ${state.title}` });
    toggleModal();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const updated = { ...state, [event.target.id]: event.target.value };
    setState(updated);
  };

  const handleVideoSrc = (url: string): void => {
    console.log(url);
    if (typeof url !== "string" || url.length === 0) return;
    const updated = { ...state, src: url };
    setState(updated);
  };

  return (
    state && (
      <ModalContainer toggle={toggleModal} motionKey={motionKey}>
        <ModalHeader>{state.title}</ModalHeader>

        <ModalInnerContainer>
          <ModalForm>
            <ModalInput
              title="Project Title"
              id="title"
              type="text"
              value={state.title}
              onChange={handleChange}
            />

            <ModalInput
              title="Video URL"
              placeholder="Dropbox, Youtube, Vimeo..."
              id="src"
              type="text"
              value={state.src ?? ""}
              onChange={handleChange}
            />

            {!state.src && <LocalVideoForm handleVideoSrc={handleVideoSrc} />}

            <div className="mt-2">{/* <ExportNotes dynamicLabel={false} /> */}</div>

            <ModalPrimaryBtn handleClick={handleUpdate}>Update</ModalPrimaryBtn>
          </ModalForm>
        </ModalInnerContainer>
      </ModalContainer>
    )
  );
};
