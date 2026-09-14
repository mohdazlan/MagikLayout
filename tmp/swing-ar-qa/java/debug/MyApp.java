import java.awt.*;
import javax.swing.*;

public class MyApp {

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame("My App");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setLayout(new BorderLayout(8, 8));

            JPanel panel1 = new JPanel(new FlowLayout(FlowLayout.CENTER, 12, 12));
            JButton button1 = new JButton("Save");
            panel1.add(button1);
            JButton button2 = new JButton("Cancel");
            panel1.add(button2);
            frame.add(panel1, BorderLayout.SOUTH);

            frame.setSize(260, 300); // includes the title bar
            frame.setVisible(true);
        });
    }
}