import { usePopperTooltip } from 'react-popper-tooltip';
import 'react-popper-tooltip/dist/styles.css';
import { BsFillInfoSquareFill } from 'react-icons/bs';
import './MVTooltip.css';



import React, { useState } from 'react';


const MVTooltip = ({tooltipText}) => {

    const [isVisible, setIsVisible] = useState(false)

    const {
        getArrowProps,
        getTooltipProps,
        setTooltipRef,
        setTriggerRef,
        visible,
      } = usePopperTooltip({
        trigger: 'click',
        closeOnOutsideClick: true,
        visible: isVisible,
        onVisibleChange: setIsVisible,
        interactive: true
      })
    return (
        <>
            <div className="field-info" ref={setTriggerRef}>
            <BsFillInfoSquareFill size={16} style={{color: 'var(--fwd-color-2)'}}/ >
            </div>
            {visible && (
            <div
                ref={setTooltipRef}
                {...getTooltipProps({ className: 'tooltip-container' })}
            >
                {tooltipText}
                <div {...getArrowProps({ className: 'tooltip-arrow' })} />
            </div>
            )}
        </>
    )
}

export default MVTooltip;