import * as React from 'react';
import { getSlotsCompat } from './getSlotsCompat';
import { nullRender } from './nullRender';

describe('getSlots', () => {
  const Foo = (props: { id?: string }) => <div />;

  it('returns div for root if the as prop is not provided', () => {
    expect(getSlotsCompat({})).toEqual({
      slots: { root: 'div' },
      slotProps: { root: {} },
    });
  });

  it('returns root slot as a span with no props', () => {
    expect(getSlotsCompat({ as: 'span' })).toEqual({
      slots: { root: 'span' },
      slotProps: { root: {} },
    });
  });

  it('omits props which are not valid for the element rendered', () => {
    expect(getSlotsCompat({ as: 'button', id: 'id', href: 'href' })).toEqual({
      slots: { root: 'button' },
      slotProps: { root: { id: 'id' } },
    });
  });

  it('returns root slot as an anchor, leaving the href intact', () => {
    expect(getSlotsCompat({ as: 'a', id: 'id', href: 'href' })).toEqual({
      slots: { root: 'a' },
      slotProps: { root: { id: 'id', href: 'href' } },
    });
  });

  it('returns root as a component, leaving the props intact minus the as prop', () => {
    expect(getSlotsCompat({ as: Foo, id: 'id', href: 'href', blah: 1 })).toEqual({
      slots: { root: Foo },
      slotProps: { root: { id: 'id', href: 'href', blah: 1 } },
    });
  });

  it('returns null for primitive slots with no children', () => {
    expect(getSlotsCompat({ as: 'div', icon: { as: 'span' } }, ['icon'])).toEqual({
      slots: { root: 'div', icon: nullRender },
      slotProps: { root: {} },
    });
  });

  it('returns a component slot with no children', () => {
    expect(getSlotsCompat({ as: 'div', icon: { as: Foo } }, ['icon'])).toEqual({
      slots: { root: 'div', icon: Foo },
      slotProps: { root: {}, icon: {} },
    });
  });

  it('returns slot as button and omits unsupported props (href)', () => {
    expect(
      getSlotsCompat({ as: 'div', icon: { as: 'button', id: 'id', href: 'href', children: 'children' } }, ['icon']),
    ).toEqual({
      slots: { root: 'div', icon: 'button' },
      slotProps: { root: {}, icon: { id: 'id', children: 'children' } },
    });
  });

  it('returns slot as anchor and includes supported props (href)', () => {
    expect(
      getSlotsCompat({ as: 'div', icon: { as: 'a', id: 'id', href: 'href', children: 'children' } }, ['icon']),
    ).toEqual({
      slots: { root: 'div', icon: 'a' },
      slotProps: { root: {}, icon: { id: 'id', href: 'href', children: 'children' } },
    });
  });

  it('returns a component and includes all props minus as prop', () => {
    expect(
      getSlotsCompat({ as: 'div', icon: { as: Foo, id: 'id', href: 'href', blah: 1, children: 'children' } }, ['icon']),
    ).toEqual({
      slots: { root: 'div', icon: Foo },
      slotProps: { root: {}, icon: { id: 'id', href: 'href', blah: 1, children: 'children' } },
    });
  });

  it('can use slot children functions to replace default slot rendering', () => {
    expect(
      getSlotsCompat(
        { as: 'div', icon: { as: Foo, id: 'bar', children: (C: React.ElementType, p: {}) => <C {...p} /> } },
        ['icon'],
      ),
    ).toEqual({
      slots: { root: 'div', icon: React.Fragment },
      slotProps: { root: {}, icon: { children: <Foo id="bar" /> } },
    });
  });

  it('can render a primitive input with no children', () => {
    expect(getSlotsCompat({ as: 'div', input: { as: 'input', children: null } }, ['input'])).toEqual({
      slots: { root: 'div', input: 'input' },
      slotProps: { root: {}, input: { children: null } },
    });
  });

  it('should use `div` as default root element', () => {
    expect(getSlotsCompat({ icon: { children: 'foo' }, customProp: 'bar' }, ['icon'])).toEqual({
      slots: { root: 'div', icon: 'span' },
      slotProps: { root: {}, icon: { children: 'foo' } },
    });
  });
});
