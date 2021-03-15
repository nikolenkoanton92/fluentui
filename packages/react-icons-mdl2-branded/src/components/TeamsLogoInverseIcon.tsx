import * as React from 'react';
import { createSvgIcon } from '@fluentui/react-icons-mdl2';

const TeamsLogoInverseIcon = createSvgIcon({
  svg: ({ classes }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className={classes.svg}>
      <path d="M1760 704q-47 0-87-17t-71-48-48-71-18-88q0-46 17-87t48-71 71-48 88-18q46 0 87 17t71 48 48 72 18 87q0 47-17 87t-48 71-72 48-87 18zm0-320q-40 0-68 28t-28 68q0 40 28 68t68 28q40 0 68-28t28-68q0-40-28-68t-68-28zm288 480v476q0 66-25 124t-68 102-102 69-125 25q-38 0-77-9t-73-28q-25 81-73 147t-112 114-143 74-162 26q-98 0-184-34t-154-94-112-142-58-178H85q-35 0-60-25t-25-60V597q0-35 25-60t60-25h733q-29-61-29-128 0-62 23-116t64-95 95-64 117-24q62 0 116 23t95 64 64 95 24 117q0 62-23 116t-64 95-95 64-117 24q-16 0-32-2t-32-5v92h928q40 0 68 28t28 68zm-960-651q-35 0-66 13t-55 37-36 55-14 66q0 35 13 66t37 55 54 36 67 14q35 0 66-13t54-37 37-54 14-67q0-35-13-66t-37-54-55-37-66-14zM592 848h192V688H240v160h192v512h160V848zm880 624V896h-448v555q0 35-25 60t-60 25H709q13 69 47 128t84 101 113 67 135 24q79 0 149-30t122-82 83-122 30-150zm448-132V896h-320v585q26 26 59 38t69 13q40 0 75-15t61-41 41-61 15-75z" />
    </svg>
  ),
  displayName: 'TeamsLogoInverseIcon',
});

export default TeamsLogoInverseIcon;