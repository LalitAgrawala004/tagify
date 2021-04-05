import React, {useMemo, useEffect, useRef, useCallback} from "react"
import {renderToStaticMarkup} from "react-dom/server"
import {string, array, func, bool, object, element, oneOfType} from "prop-types"
import Tagify from "./tagify.min.js"

const noop = _ => _

const isSameDeep = (a,b) => JSON.stringify(a) == JSON.stringify(b)

// if a template is a React component, it should be outputed as a String (and not as a React component)
function templatesToString(templates) {
    if (templates) {
        for (let templateName in templates) {
            let isReactComp = String(templates[templateName]).includes(".createElement")

            if (isReactComp) {
                let Template = templates[templateName]
                templates[templateName] = data => renderToStaticMarkup(<Template {...data} />)
            }
        }
    }
}

const TagifyWrapper = ({
    name,
    value = "",
    loading = false,
    onInput = noop,
    onAdd = noop,
    onRemove = noop,
    onEditInput = noop,
    onEditBeforeUpdate = noop,
    onEditUpdated = noop,
    onEditStart = noop,
    onEditKeydown = noop,
    onInvalid = noop,
    onClick = noop,
    onKeydown = noop,
    onFocus = noop,
    onBlur = noop,
    onChange = noop,
    onDropdownShow = noop,
    onDropdownHide = noop,
    onDropdownSelect = noop,
    onDropdownScroll = noop,
    onDropdownNoMatch = noop,
    readOnly,
    children,
    settings = {},
    InputMode = "input",
    autoFocus,
    className,
    whitelist,
    tagifyRef,
    placeholder = "",
    defaultValue,
    showDropdown
}) => {
    const mountedRef = useRef()
    const inputElmRef = useRef()
    const tagify = useRef()

    const handleRef = elm => {
        inputElmRef.current = elm
    }

    // if for some reason the developer chose to use "value" instead of "defaultValue", map it to "value"
    value = value || defaultValue

    const inputAttrs = useMemo(() => ({
        ref: handleRef,
        name,
        defaultValue: children
            ? children
            : typeof value === "string"
                ? value
                : JSON.stringify(value),
        className,
        readOnly,
        autoFocus,
        placeholder,
    }), [])

    const setFocus = useCallback(() => {
        autoFocus && tagify.current && tagify.current.DOM.input.focus()
    }, [tagify])

    useEffect(() => {
        templatesToString(settings.templates)

        if (InputMode == "textarea")
            settings.mode = "mix"

        // "whitelist" prop takes precedence
        if( whitelist && whitelist.length )
            settings.whitelist = whitelist

        const t = new Tagify(inputElmRef.current, settings)

        t.on("input"  , onInput)
        t.on("add"    , onAdd)
        t.on("remove" , onRemove)
        t.on("invalid", onInvalid)
        t.on("keydown", onKeydown)
        t.on("focus"  , onFocus)
        t.on("blur"   , onBlur)
        t.on("click"  , onClick)
        t.on("change" , onChange)

        t.on("edit:input"       , onEditInput)
        t.on("edit:beforeUpdate", onEditBeforeUpdate)
        t.on("edit:updated"     , onEditUpdated)
        t.on("edit:start"       , onEditStart)
        t.on("edit:keydown"     , onEditKeydown)

        t.on("dropdown:hide"   , onDropdownHide)
        t.on("dropdown:select" , onDropdownSelect)
        t.on("dropdown:scroll" , onDropdownScroll)
        t.on("dropdown:noMatch", onDropdownNoMatch)

        // Bridge Tagify instance with parent component
        if (tagifyRef) {
            tagifyRef.current = t
        }

        tagify.current = t

        setFocus()

        // cleanup
        return () => {
            t.destroy()
        }
    }, [])

    useEffect(() => {
        setFocus()
    }, [autoFocus])

    useEffect(() => {
        if (mountedRef.current) {
            tagify.current.settings.whitelist.length = 0

            // replace whitelist array items
            whitelist && whitelist.length && tagify.current.settings.whitelist.push(...whitelist)
        }
    }, [whitelist])

    useEffect(() => {
        const currentValue = tagify.current.getCleanValue()

        if (mountedRef.current && !isSameDeep(value, currentValue)) {
            tagify.current.loadOriginalValues(value)
        }
    }, [value])

    useEffect(() => {
        if (mountedRef.current) {
            tagify.current.toggleClass(className)
        }
    }, [className])

    useEffect(() => {
        if (mountedRef.current) {
            tagify.current.loading(loading)
        }
    }, [loading])

    useEffect(() => {
        if (mountedRef.current) {
            tagify.current.setReadonly(readOnly)
        }
    }, [readOnly])

    useEffect(() => {
        const t = tagify.current

        if (mountedRef.current) {
            if (showDropdown) {
                t.dropdown.show.call(t, showDropdown)
                t.toggleFocusClass(true)
            } else {
                t.dropdown.hide.call(t)
            }
        }
    }, [showDropdown])

    useEffect(() => {
        mountedRef.current = true
    }, [])

    return (
        // a wrapper must be used because Tagify will appened inside it it's component,
        // keeping the virtual-DOM out of the way
        <div className="tags-input">
            <InputMode {...inputAttrs} />
        </div>
    )
}

TagifyWrapper.propTypes = {
    name: string,
    value: oneOfType([string, array]),
    loading: bool,
    children: oneOfType([string, array]),
    onChange: func,
    readOnly: bool,
    settings: object,
    InputMode: string,
    autoFocus: bool,
    className: string,
    tagifyRef: object,
    whitelist: array,
    placeholder: string,
    defaultValue: oneOfType([string, array]),
    showDropdown: oneOfType([string, bool]),
    onInput: func,
    onAdd: func,
    onRemove: func,
    onEditInput: func,
    onEditBeforeUpdate: func,
    onEditUpdated: func,
    onEditStart: func,
    onEditKeydown: func,
    onInvalid: func,
    onClick: func,
    onKeydown: func,
    onFocus: func,
    onBlur: func,
    onDropdownShow: func,
    onDropdownHide: func,
    onDropdownSelect: func,
    onDropdownScroll: func,
    onDropdownNoMatch: func,
}

const Tags = React.memo(TagifyWrapper)
Tags.displayName = "Tags"

export const MixedTags = ({ children, ...rest }) =>
  <Tags InputMode="textarea" {...rest}>{children}</Tags>

export default Tags
