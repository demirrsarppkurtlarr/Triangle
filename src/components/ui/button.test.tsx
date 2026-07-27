import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Send money</Button>);
    expect(
      screen.getByRole("button", { name: "Send money" }),
    ).toBeInTheDocument();
  });

  it("can be disabled", () => {
    render(<Button disabled>Pending</Button>);
    expect(screen.getByRole("button", { name: "Pending" })).toBeDisabled();
  });
});
